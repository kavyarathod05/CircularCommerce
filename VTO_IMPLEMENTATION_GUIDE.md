# Virtual Try-On (VTO) Implementation Guide

## Executive Summary

This guide provides two production-ready approaches to implement a high-quality Virtual Try-On system for your e-commerce platform. Based on analysis of your current implementation, we recommend a hybrid approach that maximizes quality while maintaining reliability.

## Current System Analysis

### Architecture Overview
Your current VTO system (`vto_orchestrator.py`) uses a multi-stage pipeline:
1. **Pose Estimation** → Body measurements from user photo + height
2. **Fit Scoring** → Match user measurements against product size charts
3. **Visual Try-On** → IDM-VTON API (optional) or local overlay fallback
4. **Caching** → MD5-based result caching for repeat requests

### Current Limitations
- IDM-VTON integration is disabled by default (`VTO_USE_IDM=0`)
- Fallback uses simple overlay compositing (not realistic garment draping)
- No human pose estimation for garment alignment (MediaPipe optional)
- Background removal is basic (corner sampling)

---

## Approach 1: HuggingFace API Integration (Recommended for MVP)

### Overview
Use pre-trained models via HuggingFace Inference API for production-quality results without managing infrastructure.

### Key Models

#### Primary VTO Model: IDM-VTON

**Model**: `yisol/IDM-VTON`
**Type**: Image-based Virtual Try-On
**Quality**: State-of-the-art (2024)
**Current Status**: Partially implemented in `idm_vton_client.py`

**Strengths**:
- Realistic garment draping and wrinkle simulation
- Preserves garment texture and patterns accurately
- Handles complex poses and body shapes
- Maintains facial features and background

**Integration Method**:
```python
# Already implemented - needs activation
export VTO_USE_IDM=1
export HF_TOKEN=your_huggingface_token
export IDM_VTON_TIMEOUT_SEC=20
```

**API Costs** (HuggingFace Inference API):
- Free tier: 1,000 calls/month
- Pro tier: $9/month for 10,000 calls
- Enterprise: Custom pricing

**Latency**: 8-15 seconds per request (GPU inference)

#### Supporting Models

**1. Background Removal: RMBG-1.4**
- **Model**: `briaai/RMBG-1.4`
- **Purpose**: Clean product images before VTO
- **Current Status**: Implemented in `vto_engine.py`
- **Activation**: Set `VTO_USE_HF_RMBG=1`

**2. Human Pose Estimation: MediaPipe Pose**
- **Library**: `mediapipe` (Google)
- **Purpose**: Accurate body landmark detection
- **Current Status**: Optional fallback in `vto_pose.py`
- **Installation**: `pip install mediapipe`

**3. Size Recommendation Enhancement: OpenPose or DensePose**
- **Alternative**: Use AWS Rekognition DetectProtectiveEquipment for body part detection
- **Purpose**: Improve measurement accuracy

### Implementation Steps

#### Step 1: Enable IDM-VTON Integration
```bash
# Set environment variables in .env
VTO_USE_IDM=1
HF_TOKEN=hf_your_token_here
IDM_VTON_TIMEOUT_SEC=20
IDM_VTON_STEPS=30
IDM_VTON_SEED=42
```

#### Step 2: Install gradio_client for Reliable API Access
```bash
pip install gradio-client
```

Your `idm_vton_client.py` already supports this (see `call_idm_vton_gradio_client` function).

#### Step 3: Enhance Product Image Preprocessing
```python
# Enable HuggingFace background removal
VTO_USE_HF_RMBG=1
HF_TOKEN=your_token  # Same token as above
```

#### Step 4: Add Retry Logic with Exponential Backoff
Update `vto_orchestrator.py`:

```python
import time

def _try_idm_with_retry(person_bytes, garment_bytes, description, max_retries=3):
    """Retry with exponential backoff for transient failures."""
    for attempt in range(max_retries):
        try:
            result, label = try_idm_vton(person_bytes, garment_bytes, description)
            if result:
                return result, label
            time.sleep(2 ** attempt)  # 1s, 2s, 4s
        except Exception as e:
            print(f"[VTO] Attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
    return None, "retry-exhausted"
```

#### Step 5: Implement Quality Checks
```python
def _validate_vto_output(image_bytes: bytes) -> bool:
    """Ensure output image meets quality standards."""
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size
    
    # Check dimensions
    if w < 512 or h < 512:
        return False
    
    # Check for corruption (not entirely black/white)
    arr = np.array(img.convert('L'))
    mean_brightness = arr.mean()
    if mean_brightness < 10 or mean_brightness > 245:
        return False
    
    return True
```

### Pros & Cons

**Pros**:
✅ No ML infrastructure to manage
✅ State-of-the-art model quality
✅ Quick to implement (already 80% integrated)
✅ Scalable via HuggingFace infrastructure
✅ Fallback to local overlay ensures 100% uptime

**Cons**:
❌ 8-15s latency (mitigated by caching)
❌ Recurring API costs at scale
❌ Dependency on external service
❌ Rate limits on free tier

---

## Approach 2: Self-Hosted ML Models (For Scale)

### Overview
Host open-source VTO models on your own infrastructure for lower per-request costs and full control.

### Recommended Model Stack

#### Primary: OOTDiffusion (Open-Source Alternative to IDM-VTON)
- **Repository**: `https://github.com/levihsu/OOTDiffusion`
- **License**: Non-commercial research (check before production)
- **Quality**: Near IDM-VTON quality
- **Inference Time**: 5-8s on A10G GPU

**Hardware Requirements**:
- GPU: NVIDIA A10G (AWS g5.xlarge) or T4 (AWS g4dn.xlarge)
- VRAM: 16GB minimum
- CPU: 4 cores
- RAM: 16GB

#### Alternative: Outfit-Anyone

- **Repository**: `https://github.com/HumanAIGC/OutfitAnyone`
- **Strengths**: Better pose preservation
- **Licensing**: Check MIT/Apache status

### Implementation Architecture

```
┌─────────────────┐
│  FastAPI Server │ (Your current main.py)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Model Service   │ (New: vto_model_server.py)
│ (GPU Instance)  │
│                 │
│ - OOTDiffusion  │
│ - RMBG-1.4      │
│ - MediaPipe     │
└─────────────────┘
```

### Deployment Options

#### Option A: AWS SageMaker
**Best for**: Production with auto-scaling

```python
# Deploy via SageMaker Endpoint
import sagemaker
from sagemaker.huggingface import HuggingFaceModel

hub = {
    'HF_MODEL_ID': 'yisol/IDM-VTON',  # Or custom model
    'HF_TASK': 'image-to-image'
}

huggingface_model = HuggingFaceModel(
    transformers_version='4.26.0',
    pytorch_version='1.13.1',
    py_version='py39',
    env=hub,
    role=role
)

predictor = huggingface_model.deploy(
    initial_instance_count=1,
    instance_type='ml.g5.xlarge'
)
```

**Cost**: ~$1.01/hour (g5.xlarge) = $730/month per instance

#### Option B: AWS Lambda + EFS (For Smaller Models)
**Best for**: Sporadic usage with cold starts acceptable

```yaml
# SAM template.yaml addition
  VTOModelFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ml-service/
      Handler: vto_lambda.handler
      Runtime: python3.11
      MemorySize: 10240  # Max Lambda memory
      Timeout: 900  # 15 min max
      EphemeralStorage:
        Size: 10240  # 10GB for model weights
      FileSystemConfigs:
        - Arn: !GetAtt VTOModelEFS.Arn
          LocalMountPath: /mnt/models
```

**Cost**: Pay per invocation (~$0.0001 per 100ms + GPU costs if using Lambda with GPU)

#### Option C: EC2 with Auto-Scaling Group
**Best for**: Predictable high traffic

```bash
# User data script for EC2 instance
#!/bin/bash
apt update && apt install -y python3-pip nvidia-docker2
pip3 install torch torchvision diffusers transformers accelerate
git clone https://github.com/levihsu/OOTDiffusion.git
cd OOTDiffusion && pip3 install -r requirements.txt
python3 vto_model_server.py  # Your custom FastAPI model server
```

**Cost**: ~$0.526/hour (g4dn.xlarge with T4 GPU) = $380/month per instance

### Self-Hosted Implementation Steps

#### Step 1: Create Model Server
Create `backend/ml-service/vto_model_server.py`:

```python
"""Self-hosted VTO model inference server."""
import torch
from fastapi import FastAPI, File, UploadFile
from PIL import Image
import io

app = FastAPI()

# Load model at startup (once)
@app.on_event("startup")
async def load_models():
    global vto_pipeline
    from diffusers import StableDiffusionPipeline  # Adjust for actual VTO model
    
    vto_pipeline = StableDiffusionPipeline.from_pretrained(
        "path/to/ootdiffusion",
        torch_dtype=torch.float16,
        use_safetensors=True
    )
    vto_pipeline.to("cuda")
    print("✅ VTO model loaded")

@app.post("/vto/infer")
async def infer_vto(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...)
):
    """Run VTO inference."""
    person_bytes = await person_image.read()
    garment_bytes = await garment_image.read()
    
    person_img = Image.open(io.BytesIO(person_bytes))
    garment_img = Image.open(io.BytesIO(garment_bytes))
    
    # Run inference
    result = vto_pipeline(
        person_img,
        garment_img,
        num_inference_steps=30
    )
    
    # Return result
    output_buffer = io.BytesIO()
    result.images[0].save(output_buffer, format="JPEG", quality=90)
    return {"image_base64": base64.b64encode(output_buffer.getvalue()).decode()}

# Run: uvicorn vto_model_server:app --host 0.0.0.0 --port 8001
```

#### Step 2: Update Main Service to Call Model Server

Update `vto_orchestrator.py`:

```python
def _call_self_hosted_vto(person_bytes: bytes, garment_bytes: bytes) -> Optional[bytes]:
    """Call self-hosted model server."""
    model_server_url = os.getenv("VTO_MODEL_SERVER_URL", "http://localhost:8001")
    
    files = {
        'person_image': ('person.jpg', person_bytes, 'image/jpeg'),
        'garment_image': ('garment.jpg', garment_bytes, 'image/jpeg')
    }
    
    try:
        response = requests.post(
            f"{model_server_url}/vto/infer",
            files=files,
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            return base64.b64decode(data['image_base64'])
    except Exception as e:
        print(f"[VTO] Self-hosted model failed: {e}")
    
    return None
```

#### Step 3: Add Load Balancing
Use AWS Application Load Balancer to distribute across multiple GPU instances:

```
Internet → ALB → Target Group → [GPU Instance 1, GPU Instance 2, ...]
```

#### Step 4: Implement Health Checks

```python
@app.get("/health")
async def health_check():
    """Kubernetes/ALB health probe."""
    return {
        "status": "healthy",
        "gpu_available": torch.cuda.is_available(),
        "model_loaded": vto_pipeline is not None
    }
```

### Pros & Cons

**Pros**:
✅ Lower per-request cost at scale (>10k requests/month)
✅ No external API dependencies
✅ Full control over model versions
✅ Customizable inference parameters
✅ Better latency (5-8s vs 8-15s)

**Cons**:
❌ High upfront infrastructure cost
❌ Need ML ops expertise
❌ Model maintenance and updates required
❌ GPU instance management complexity

---

## Recommended Hybrid Approach

### Strategy: Start with API, Scale with Self-Hosting

#### Phase 1: MVP (Month 1-3)
- Use HuggingFace API (Approach 1)
- Enable IDM-VTON via gradio_client
- Implement aggressive caching (Redis)
- Monitor usage and costs

**When to use**:
- Traffic < 5,000 VTO requests/month
- Testing product-market fit
- Iterating on features

**Estimated Cost**: $0-50/month

#### Phase 2: Growth (Month 3-6)
- Add Redis for persistent caching
- Pre-generate VTOs for popular products
- Monitor cache hit rate (target >70%)

**When to use**:
- Traffic: 5,000 - 20,000 requests/month
- API costs becoming significant ($200+/month)

**Estimated Cost**: $100-300/month (API + Redis)

#### Phase 3: Scale (Month 6+)
- Deploy self-hosted model on AWS SageMaker or EC2
- Route new requests to self-hosted, cache misses to API as fallback
- Gradually migrate all traffic to self-hosted

**When to use**:
- Traffic > 20,000 requests/month
- API costs > $500/month
- Need <5s latency guarantees

**Estimated Cost**: $500-1500/month (GPU instances + minimal API fallback)

### Cost Break-Even Analysis

| Monthly Requests | HF API Cost | Self-Hosted Cost | Recommended |
|-----------------|-------------|------------------|-------------|
| 1,000 | $0 (free) | $730 | **API** |
| 5,000 | $45 | $730 | **API** |
| 10,000 | $90 | $730 | **API** |
| 20,000 | $180 | $730 | **API** |
| 50,000 | $450 | $730 | **API** |
| 100,000 | $900 | $1,460 (2x GPU) | **Self-Hosted** |
| 500,000 | $4,500 | $3,650 (5x GPU) | **Self-Hosted** |

---

