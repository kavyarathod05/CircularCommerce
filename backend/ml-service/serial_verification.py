"""
SecondLife Commerce — Multimodal Serial Number Verification Engine
==================================================================
Combines Object Detection & Optical Character Recognition (OCR) 
to cross-reference returned physical goods against the outbound shipping ledger.

Architecture:
- Primary: Hugging Face Inference API (Idefics2 / Vision-Language Model)
- Fallback: Simulated heuristic OCR for hackathon reliability
"""

import re
import base64
import random
import time
import requests
import os
from typing import Dict, Any

class SerialVerificationEngine:
    def __init__(self):
        # We can configure this with an actual Hugging Face API key
        self.hf_api_key = os.getenv("HF_API_KEY", "")
        # IDEFICS2 or a fast Donut model for document parsing
        self.api_url = "https://api-inference.huggingface.co/models/HuggingFaceM4/idefics2-8b"
        
        # Outbound ledger mock (would be a DB lookup in production)
        self.shipping_ledger = {
            "ORD-001": "SN-984A-B72C-11",
            "ORD-002": "MAC-11-22-33-44",
            "ORD-003": "IMEI-84920183741",
            "ORD-004": "AMZ-RTX4090-882",
        }

    def _call_idefics2_api(self, image_b64: str, prompt: str) -> str:
        """Attempts to call the actual IDEFICS2 model via HF Serverless Inference API."""
        headers = {"Authorization": f"Bearer {self.hf_api_key}"}
        
        # Format for IDEFICS2 prompt structure
        payload = {
            "inputs": f"![]({image_b64}) {prompt}",
            "parameters": {
                "max_new_tokens": 50,
                "temperature": 0.2
            }
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=8)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get("generated_text", "")
            return ""
        except Exception:
            return ""

    def _simulated_ocr_extraction(self, image_b64: str, expected_sn: str) -> Dict[str, Any]:
        """
        Fallback simulation for the hackathon context if API key is missing or rate limited.
        Simulates the time and noise of real OCR.
        """
        time.sleep(1.2) # Simulate network/inference latency
        
        # We simulate the AI "looking" at the image. 
        # For demonstration, we introduce a chance of slight OCR error or success.
        
        success_chance = random.random()
        
        if success_chance > 0.25:
            # 75% chance the model reads it perfectly
            extracted = expected_sn
            confidence = round(random.uniform(0.85, 0.99), 3)
            bbox = [120, 450, 400, 500] # [x1, y1, x2, y2]
        elif success_chance > 0.10:
            # 15% chance it reads it with a typo
            chars = list(expected_sn)
            if len(chars) > 2:
                idx = random.randint(0, len(chars)-1)
                chars[idx] = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
            extracted = "".join(chars)
            confidence = round(random.uniform(0.60, 0.84), 3)
            bbox = [118, 448, 405, 505]
        else:
            # 10% chance it finds nothing or garbage
            extracted = "UNREADABLE-SN"
            confidence = round(random.uniform(0.10, 0.40), 3)
            bbox = [0, 0, 0, 0]

        # Simulate detecting the object type
        detected_objects = ["cardboard_box", "shipping_label", "barcode"]
        
        return {
            "extracted_text": extracted,
            "confidence": confidence,
            "bounding_box": bbox,
            "detected_objects": detected_objects
        }

    def verify_return(self, order_id: str, image_b64: str, user_claimed_sn: str = None) -> Dict[str, Any]:
        """
        Core verification pipeline.
        1. Look up outbound ledger for expected serial number.
        2. Run VLM / OCR on the image.
        3. Cross-reference expected vs extracted.
        """
        # 1. Lookup
        expected_sn = self.shipping_ledger.get(order_id)
        if not expected_sn and user_claimed_sn:
             expected_sn = user_claimed_sn
             
        if not expected_sn:
            return {
                "status": "error",
                "message": "Order ID not found in outbound ledger and no claimed SN provided."
            }

        # 2. Run Vision Model
        extraction_result = None
        if self.hf_api_key:
            # Try Real IDEFICS2
            prompt = "What is the serial number or alphanumeric code printed on this label? Only return the code."
            raw_text = self._call_idefics2_api(image_b64, prompt)
            if raw_text:
                # Clean up the output
                cleaned = re.sub(r'[^A-Za-z0-9-]', '', raw_text)
                extraction_result = {
                    "extracted_text": cleaned,
                    "confidence": 0.85, # IDEFICS API doesn't provide token logprobs easily, mock confidence
                    "bounding_box": None,
                    "detected_objects": ["product", "label"]
                }
        
        if not extraction_result:
            # Fallback to simulation
            extraction_result = self._simulated_ocr_extraction(image_b64, expected_sn)

        extracted_sn = extraction_result["extracted_text"]
        
        # 3. Cross-reference Logic
        # Simple string matching, could use Levenshtein distance for fuzzy matching
        is_match = (extracted_sn.upper() == expected_sn.upper())
        
        # Determine Fraud Risk
        fraud_risk = "LOW"
        if not is_match:
            # Calculate similarity to see if it's a typo or completely wrong
            matches = sum(1 for a, b in zip(extracted_sn, expected_sn) if a == b)
            similarity = matches / max(len(expected_sn), 1)
            
            if similarity > 0.8:
                fraud_risk = "MEDIUM" # Likely an OCR error
            else:
                fraud_risk = "HIGH"   # Completely different SN -> Potential Fraud (Item Swapping)

        return {
            "status": "success",
            "order_id": order_id,
            "expected_serial": expected_sn,
            "vision_analysis": extraction_result,
            "verification": {
                "is_match": is_match,
                "fraud_risk_level": fraud_risk,
                "engine_used": "IDEFICS2-API" if self.hf_api_key else "VLM-Heuristic-Sim"
            }
        }
