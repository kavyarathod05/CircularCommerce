"""
Setup script for Kolors Virtual Try-On
Downloads model weights and configures environment
"""

import os
import sys
import subprocess
from pathlib import Path

def check_gpu():
    """Check if CUDA GPU is available."""
    try:
        import torch
        has_cuda = torch.cuda.is_available()
        if has_cuda:
            gpu_name = torch.cuda.get_device_name(0)
            print(f"✅ GPU detected: {gpu_name}")
            print(f"   CUDA version: {torch.version.cuda}")
            return True
        else:
            print("⚠️  No GPU detected. Will use CPU (much slower)")
            return False
    except ImportError:
        print("❌ PyTorch not installed")
        return False

def install_dependencies():
    """Install required packages."""
    print("\n📦 Installing dependencies...")
    
    packages = [
        "torch",
        "torchvision",
        "diffusers>=0.25.0",
        "transformers>=4.35.0",
        "accelerate>=0.24.0",
        "gradio-client",
        "safetensors",
        "sentencepiece",
    ]
    
    for package in packages:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    
    print("✅ Dependencies installed")

def download_model():
    """Download Kolors VTO model from HuggingFace."""
    print("\n📥 Downloading Kolors VTO model...")
    print("   This may take 10-15 minutes depending on your connection...")
    
    try:
        from huggingface_hub import snapshot_download
        
        model_id = "Kwai-Kolors/Kolors-Virtual-Try-On"
        local_dir = "./kolors_vto_models"
        
        # Get HF token if available
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HF_API_KEY")
        
        snapshot_download(
            repo_id=model_id,
            local_dir=local_dir,
            token=hf_token,
            resume_download=True,
        )
        
        print(f"✅ Model downloaded to {local_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to download model: {e}")
        print("   You can still use the API mode (slower but works without download)")
        return False

def create_env_config():
    """Create .env configuration for Kolors VTO."""
    env_file = Path(".env")
    
    print("\n⚙️  Configuring environment...")
    
    config_lines = [
        "\n# Kolors Virtual Try-On Configuration",
        "VTO_USE_KOLORS=1  # Enable Kolors VTO (best quality)",
        "KOLORS_VTO_LOCAL=1  # Use local inference (requires GPU)",
        "VTO_USE_IDM=0  # IDM-VTON fallback (optional)",
        "VTO_USE_HF_RMBG=1  # Background removal",
    ]
    
    if env_file.exists():
        with open(env_file, "a") as f:
            f.write("\n".join(config_lines) + "\n")
        print(f"✅ Configuration appended to {env_file}")
    else:
        with open(env_file, "w") as f:
            f.write("# ML Service Environment Variables\n")
            f.write("\n".join(config_lines) + "\n")
        print(f"✅ Configuration created at {env_file}")
    
    # Check if HF token is set
    hf_token = os.getenv("HF_TOKEN") or os.getenv("HF_API_KEY")
    if not hf_token:
        print("\n⚠️  HuggingFace token not found!")
        print("   For API fallback mode, set: HF_TOKEN=your_token_here")
        print("   Get token from: https://huggingface.co/settings/tokens")

def run_test():
    """Run a simple test of the VTO system."""
    print("\n🧪 Running test...")
    
    try:
        from kolors_vto_local import get_kolors_vto_engine
        engine = get_kolors_vto_engine()
        print("✅ Kolors VTO engine initialized successfully")
        return True
    except Exception as e:
        print(f"⚠️  Test failed: {e}")
        print("   The system will fall back to API mode when needed")
        return False

def main():
    """Main setup flow."""
    print("=" * 60)
    print("  Kolors Virtual Try-On - Setup Wizard")
    print("=" * 60)
    
    # Step 1: Check GPU
    has_gpu = check_gpu()
    
    # Step 2: Install dependencies
    install_dependencies()
    
    # Step 3: Download model (optional, skip if no GPU)
    if has_gpu:
        choice = input("\n📥 Download model weights for local inference? (y/n): ").lower()
        if choice == 'y':
            download_model()
    else:
        print("\n⏩ Skipping model download (no GPU detected)")
        print("   Will use HuggingFace API mode instead")
    
    # Step 4: Configure environment
    create_env_config()
    
    # Step 5: Run test
    run_test()
    
    print("\n" + "=" * 60)
    print("  Setup Complete!")
    print("=" * 60)
    print("\n📝 Next steps:")
    print("   1. Set HF_TOKEN in .env if using API mode")
    print("   2. Run: python kolors_vto_local.py person.jpg garment.jpg")
    print("   3. Or start your FastAPI server: uvicorn main:app --reload")
    print("\n💡 Tips:")
    print("   - Local mode (GPU): ~5-8s per image, unlimited usage")
    print("   - API mode (no GPU): ~10-15s per image, rate limited")
    print("   - The system auto-falls back to API if local fails")

if __name__ == "__main__":
    main()
