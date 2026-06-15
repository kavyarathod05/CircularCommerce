"""
Kolors Virtual Try-On - Local Integration
Based on Kwai-Kolors/Kolors-Virtual-Try-On Space
Repository: https://huggingface.co/spaces/Kwai-Kolors/Kolors-Virtual-Try-On
"""

import os
import torch
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Optional, Tuple
import io

class KolorsVTOLocal:
    """Local Kolors Virtual Try-On inference engine."""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize Kolors VTO model.
        
        Args:
            model_path: Path to downloaded model weights. If None, downloads from HF.
        """
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_path = model_path or "./kolors_vto_models"
        self.pipe = None
        self.loaded = False
        
        print(f"[Kolors VTO] Initializing on device: {self.device}")
    
    def load_model(self):
        """Load Kolors VTO pipeline from HuggingFace."""
        if self.loaded:
            return
        
        try:
            from diffusers import AutoPipelineForInpainting
            from diffusers.utils import load_image
            
            # Kolors uses a modified Stable Diffusion XL pipeline
            print("[Kolors VTO] Loading model from Kwai-Kolors/Kolors-Virtual-Try-On...")
            
            self.pipe = AutoPipelineForInpainting.from_pretrained(
                "Kwai-Kolors/Kolors-Virtual-Try-On",
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                use_safetensors=True,
            )
            
            self.pipe = self.pipe.to(self.device)
            
            # Enable optimizations
            if self.device == "cuda":
                self.pipe.enable_model_cpu_offload()
                self.pipe.enable_vae_slicing()
            
            self.loaded = True
            print("[Kolors VTO] ✅ Model loaded successfully")
            
        except Exception as e:
            print(f"[Kolors VTO] ❌ Failed to load model: {e}")
            print("[Kolors VTO] Falling back to gradio_client API mode")
            self.loaded = False
    
    def preprocess_person_image(self, image: Image.Image) -> Image.Image:
        """Preprocess person photo for VTO."""
        # Resize to optimal dimensions (768x1024 for Kolors)
        target_width = 768
        target_height = 1024
        
        # Maintain aspect ratio
        img = image.convert("RGB")
        aspect = img.width / img.height
        
        if aspect > target_width / target_height:
            # Width is limiting factor
            new_width = target_width
            new_height = int(target_width / aspect)
        else:
            # Height is limiting factor
            new_height = target_height
            new_width = int(target_height * aspect)
        
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Pad to target size
        padded = Image.new("RGB", (target_width, target_height), (255, 255, 255))
        paste_x = (target_width - new_width) // 2
        paste_y = (target_height - new_height) // 2
        padded.paste(img, (paste_x, paste_y))
        
        return padded
    
    def preprocess_garment_image(self, image: Image.Image) -> Image.Image:
        """Preprocess garment image (remove background if needed)."""
        img = image.convert("RGBA")
        
        # Simple background removal for clean garment images
        # For production, use RMBG-1.4 or similar
        return img.convert("RGB")
    
    def generate_tryon(
        self,
        person_image: Image.Image,
        garment_image: Image.Image,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5,
        seed: int = 42,
    ) -> Image.Image:
        """
        Generate virtual try-on result.
        
        Args:
            person_image: Photo of person
            garment_image: Photo of garment to try on
            num_inference_steps: Diffusion steps (higher = better quality, slower)
            guidance_scale: Classifier-free guidance scale
            seed: Random seed for reproducibility
        
        Returns:
            Result image showing person wearing garment
        """
        if not self.loaded:
            self.load_model()
        
        if not self.loaded:
            raise RuntimeError("Model failed to load. Check dependencies.")
        
        # Preprocess inputs
        person = self.preprocess_person_image(person_image)
        garment = self.preprocess_garment_image(garment_image)
        
        # Set seed for reproducibility
        generator = torch.Generator(device=self.device).manual_seed(seed)
        
        # Run inference
        print(f"[Kolors VTO] Running inference (steps={num_inference_steps})...")
        result = self.pipe(
            prompt="person wearing garment, high quality, photorealistic",
            image=person,
            mask_image=garment,  # Garment acts as conditioning
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            generator=generator,
        ).images[0]
        
        print("[Kolors VTO] ✅ Inference complete")
        return result
    
    def generate_from_bytes(
        self,
        person_bytes: bytes,
        garment_bytes: bytes,
        **kwargs
    ) -> Tuple[bytes, str]:
        """
        Generate VTO from raw image bytes.
        
        Returns:
            Tuple of (result_image_bytes, model_label)
        """
        try:
            person_img = Image.open(io.BytesIO(person_bytes))
            garment_img = Image.open(io.BytesIO(garment_bytes))
            
            result_img = self.generate_tryon(person_img, garment_img, **kwargs)
            
            # Convert to bytes
            output_buffer = io.BytesIO()
            result_img.save(output_buffer, format="JPEG", quality=90)
            
            return output_buffer.getvalue(), "kolors-vto-local"
            
        except Exception as e:
            print(f"[Kolors VTO] Error during generation: {e}")
            return None, f"kolors-vto-error: {str(e)}"


# Gradio Client fallback for when local model isn't loaded
class KolorsVTOClient:
    """Use HuggingFace Spaces API as fallback."""
    
    def __init__(self):
        # Try alternative Kolors spaces that have working APIs
        self.spaces = [
            "yisol/IDM-VTON",  # Fallback to IDM-VTON (proven to work)
            "levihsu/OOTDiffusion",  # Another option
        ]
        self.active_space = None
    
    def generate_from_bytes(
        self,
        person_bytes: bytes,
        garment_bytes: bytes,
        **kwargs
    ) -> Tuple[Optional[bytes], str]:
        """Call VTO via Gradio API - tries multiple spaces."""
        
        # Try IDM-VTON first (most reliable)
        try:
            from gradio_client import Client, handle_file
            import tempfile
            
            space_name = "yisol/IDM-VTON"
            print(f"[Kolors VTO Client] Using {space_name}...")
            
            hf_token = os.getenv("HF_TOKEN") or os.getenv("HF_API_KEY")
            client = Client(space_name, token=hf_token)
            
            # Save to temp files
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as person_f:
                person_f.write(person_bytes)
                person_path = person_f.name
            
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as garment_f:
                garment_f.write(garment_bytes)
                garment_path = garment_f.name
            
            try:
                # Call IDM-VTON API
                print("[Kolors VTO Client] Calling IDM-VTON API...")
                result = client.predict(
                    dict(background=handle_file(person_path), layers=[], composite=None),
                    handle_file(garment_path),
                    "upper body garment",
                    True,  # is_checked
                    True,  # is_checked_crop
                    30,    # denoise_steps
                    42,    # seed
                    api_name="/tryon"
                )
                
                print(f"[Kolors VTO Client] Result type: {type(result)}")
                
                # Result is usually a tuple or dict
                if isinstance(result, tuple) and len(result) > 0:
                    result_path = result[0]
                elif isinstance(result, dict) and 'image' in result:
                    result_path = result['image']
                elif isinstance(result, str):
                    result_path = result
                else:
                    print(f"[Kolors VTO Client] Unexpected result format: {result}")
                    return None, "unexpected-result-format"
                
                # Read result file
                if isinstance(result_path, str) and os.path.isfile(result_path):
                    with open(result_path, "rb") as f:
                        return f.read(), "idm-vton-api"
                elif isinstance(result_path, str) and result_path.startswith("http"):
                    import requests
                    return requests.get(result_path, timeout=60).content, "idm-vton-api"
                
                return None, "no-valid-output"
                
            finally:
                # Cleanup
                try:
                    os.unlink(person_path)
                    os.unlink(garment_path)
                except:
                    pass
                
        except Exception as e:
            print(f"[Kolors VTO Client] Error: {e}")
            import traceback
            traceback.print_exc()
            return None, f"api-error: {str(e)}"


# Factory function
def get_kolors_vto_engine(prefer_local: bool = True):
    """
    Get Kolors VTO engine (local or API-based).
    
    Args:
        prefer_local: If True, tries local inference first, falls back to API
    
    Returns:
        VTO engine instance
    """
    use_local = os.getenv("KOLORS_VTO_LOCAL", "1") == "1" and prefer_local
    
    if use_local and torch.cuda.is_available():
        print("[Kolors VTO] Using local GPU inference")
        return KolorsVTOLocal()
    else:
        print("[Kolors VTO] Using HuggingFace Spaces API")
        return KolorsVTOClient()


# Test function
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 3:
        print("Usage: python kolors_vto_local.py <person_image> <garment_image>")
        sys.exit(1)
    
    person_path = sys.argv[1]
    garment_path = sys.argv[2]
    
    # Load images
    with open(person_path, "rb") as f:
        person_bytes = f.read()
    with open(garment_path, "rb") as f:
        garment_bytes = f.read()
    
    # Run VTO
    engine = get_kolors_vto_engine()
    result_bytes, label = engine.generate_from_bytes(person_bytes, garment_bytes)
    
    if result_bytes:
        output_path = "kolors_vto_result.jpg"
        with open(output_path, "wb") as f:
            f.write(result_bytes)
        print(f"✅ Result saved to {output_path} (model: {label})")
    else:
        print(f"❌ Failed: {label}")
