import os
import json
import base64
import re
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from PIL import Image
from io import BytesIO

class LocalAIIntegrations:
    """
    100% Local Machine Learning Models
    Runs Vision-Language inference offline using vikhyatk/moondream2.
    """
    def __init__(self):
        print("Initializing Local Vision Model (vikhyatk/moondream2)... This may take a minute to download weights the first time.")
        self.model_id = "vikhyatk/moondream2"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id, trust_remote_code=True
        ).to(self.device)
        self.model.eval()
        print(f"Local model successfully loaded to {self.device}.")

    def inspect_product_condition(self, image_bytes_list):
        """
        Damage Assessment: Local inference on product condition.
        """
        print("Invoking Local Vision Model (moondream2) for Damage Assessment...")
        try:
            # We just take the first image for the local model to avoid memory blowout
            img_data = image_bytes_list[0]
            if isinstance(img_data, str):
                if "," in img_data:
                    img_data = img_data.split(",")[1]
                try:
                    img_data = base64.b64decode(img_data)
                except Exception:
                    img_data = img_data.encode('utf-8')
            
            image = Image.open(BytesIO(img_data)).convert("RGB")
            
            # Encode image
            enc_image = self.model.encode_image(image)
            
            # Generate condition reasoning
            prompt = "Describe the physical condition of this item. Are there any cracks, scratches, or damages? Be very specific."
            answer = self.model.answer_question(enc_image, prompt, self.tokenizer)
            
            # Since the model returns raw text, we will parse it into our JSON schema
            grade = "C"
            if "no" in answer.lower() and "perfect" in answer.lower():
                grade = "A"
            elif "scratch" in answer.lower() and "crack" not in answer.lower():
                grade = "B"
            elif "crack" in answer.lower() or "shatter" in answer.lower() or "broken" in answer.lower():
                grade = "C"
                
            return {
                "grade": grade,
                "ebayConditionId": 7000 if grade == "C" else 3000,
                "ebayConditionName": "For parts or not working" if grade == "C" else "Used",
                "gradeReasoning": answer,
                "damages": [
                    {
                        "type": "detected damage based on description",
                        "severity": 8 if grade == "C" else 3,
                        "description": answer,
                        "boundingBox": {"xmin": 0.1, "ymin": 0.1, "xmax": 0.9, "ymax": 0.9} # Local models like moondream don't do native bounding boxes easily
                    }
                ],
                "packagingCondition": "Unknown - Visual inference only",
                "functionalityAssessment": "Requires manual testing",
                "repairCostBracket": "high" if grade == "C" else "low",
                "fraudSignals": [],
                "confidenceScore": 0.85,
                "summary": f"Local AI Analysis: {answer}"
            }
            
        except Exception as e:
            print("\n" + "="*50)
            print("X LOCAL ML INFERENCE ERROR")
            print("="*50)
            print(f"Error: {e}")
            print("System Action: Activating Mock Engine fallback...")
            print("="*50 + "\n")
            return self._mock_assessment()

    def determine_disposition_agent(self, condition_data, msrp):
        """
        Since running multiple LLMs on CPU is unfeasible, we use the deterministic rule engine.
        """
        print("Invoking Deterministic Disposition Routing...")
        return self._mock_disposition(condition_data, msrp)

    def _mock_assessment(self):
        return {
            "grade": "C",
            "ebayConditionId": 7000,
            "ebayConditionName": "For parts or not working",
            "gradeReasoning": "Significant structural damage detected.",
            "damages": [{"type": "crack", "severity": 8, "description": "Glass fracture", "boundingBox": {"xmin": 0.65, "ymin": 0.70, "xmax": 0.95, "ymax": 0.95}}],
            "packagingCondition": "Original packaging missing",
            "functionalityAssessment": "Touch interface likely compromised",
            "repairCostBracket": "high",
            "fraudSignals": [],
            "confidenceScore": 0.98,
            "summary": "Severe fracture detected. Unsuitable for direct P2P resale."
        }
        
    def _mock_disposition(self, condition_data, msrp):
        grade = condition_data.get('grade', 'C').upper()
        pathway = 'hyperlocal-p2p'
        if msrp < 5000:
            pathway = 'locker-dropoff'
        else:
            if 'C' in grade or 'D' in grade:
                pathway = 'refurbish' if msrp > 10000 else 'recycle'
            elif 'B' in grade:
                pathway = 'refurbish'
            else:
                pathway = 'premium'
        
        return {
            "pathway": pathway,
            "reasoning": f"Local Engine: Routed to {pathway} based on Grade {grade} and MSRP {msrp}"
        }
