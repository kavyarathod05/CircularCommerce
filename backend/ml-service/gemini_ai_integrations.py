import os
import json
import base64
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class GeminiAIIntegrations:
    """
    Google Gemini AI Integrations (Replaces AWS Bedrock)
    Handles Phase 4 & Phase 6 Core AI Defect & Fraud Detection via real inference.
    """
    def __init__(self):
        # Configure Gemini API key from environment
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found in environment. AI features will fail or mock.")
        else:
            genai.configure(api_key=self.api_key)
            
        # We use gemini-3.5-flash for fast multimodal reasoning
        self.vision_model_name = "gemini-3.5-flash"

    def inspect_product_condition(self, image_bytes_list):
        """
        Damage Assessment: Integrate Google Gemini for Condition Grading.
        Maps grades to eBay standard taxonomies.
        """
        print("Invoking Google Gemini 1.5 Flash for Multimodal Damage Assessment...")
        if not self.api_key:
            return self._mock_assessment()

        try:
            model = genai.GenerativeModel(self.vision_model_name)
            
            prompt = (
                "You are an expert product assessor. Analyze the uploaded product image(s). "
                "Evaluate the physical condition of the item, identify any defects or damages, "
                "estimate severity, locate bounding boxes where applicable (relative coordinates xmin, ymin, xmax, ymax between 0.0 and 1.0), "
                "evaluate the packaging, and assign a grade (A, B, C, or D).\n"
                "Also map to eBay condition codes:\n"
                "- 1000: New\n"
                "- 1500: New other\n"
                "- 2000: Certified Refurbished\n"
                "- 2500: Seller refurbished\n"
                "- 2750: Like New\n"
                "- 3000: Used\n"
                "- 7000: For parts or not working\n"
                "Respond strictly with a JSON object containing the following keys: "
                "grade, ebayConditionId, ebayConditionName, gradeReasoning, damages (list of dicts with type, severity, description, boundingBox), "
                "packagingCondition, functionalityAssessment, repairCostBracket (low/medium/high), confidenceScore, summary."
            )
            
            contents = [prompt]
            for img_bytes in image_bytes_list:
                img_data = img_bytes
                if isinstance(img_data, str):
                    if "," in img_data:
                        img_data = img_data.split(",")[1]
                    try:
                        img_data = base64.b64decode(img_data)
                    except Exception:
                        img_data = img_bytes.encode('utf-8')
                
                contents.append({
                    "mime_type": "image/jpeg",
                    "data": img_data
                })

            response = model.generate_content(contents)
            
            res_text = response.text
            json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(res_text)
            
        except Exception as e:
            print("\n" + "="*50)
            print("X GEMINI API INTEGRATION ERROR")
            print("="*50)
            print(f"Error: {e}")
            print("System Action: Activating Mock Engine fallback...")
            print("="*50 + "\n")
            return self._mock_assessment()

    def determine_disposition_agent(self, condition_data, msrp):
        """
        AI-Driven Disposition Logic (Agent reasoning)
        Takes the visual grade JSON and business context to decide routing.
        """
        print("Invoking Gemini Agent for Disposition Routing...")
        if not self.api_key:
            return self._mock_disposition(condition_data, msrp)

        try:
            model = genai.GenerativeModel(self.vision_model_name)
                
            prompt = (
                "You are a reverse logistics routing agent. Based on the product's condition and MSRP, "
                "determine the optimal disposition pathway. \n\n"
                "Rules:\n"
                "1. If condition grade is 'A' (New/Flawless) -> Output 'resell' or 'premium'\n"
                "2. If condition has cosmetic damage (Grade B) and repair is profitable (cost < 30% margin) -> Output 'refurbish' or 'hyperlocal-p2p' (if fit/defective reason)\n"
                "3. If condition is severe (Grade C/D) and MSRP < 10000 -> Output 'recycle'\n"
                "4. If condition is severe (Grade C/D) and MSRP > 10000 -> Output 'refurbish'\n\n"
                f"Item MSRP: {msrp}\n"
                f"Condition Data: {json.dumps(condition_data)}\n\n"
                "Respond strictly with a JSON object containing keys: 'pathway' (string: one of premium, resell, refurbish, recycle, hyperlocal-p2p, locker-dropoff), 'reasoning' (string explaining why)."
            )
            
            response = model.generate_content(prompt)
            
            res_text = response.text
            json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(res_text)
            
        except Exception as e:
            print(f"Gemini Disposition Agent failed: {e}. Falling back to rule engine.")
            return self._mock_disposition(condition_data, msrp)

    def _mock_assessment(self):
        mock_response = {
            "grade": "C",
            "ebayConditionId": 7000,
            "ebayConditionName": "For parts or not working",
            "gradeReasoning": "Significant structural damage detected. Spiderweb glass fracture located in the bottom-right quadrant.",
            "damages": [
                {
                    "type": "spiderweb crack",
                    "severity": 8,
                    "description": "Deep glass fracture affecting structural integrity",
                    "boundingBox": {
                        "xmin": 0.65,
                        "ymin": 0.70,
                        "xmax": 0.95,
                        "ymax": 0.95
                    }
                }
            ],
            "packagingCondition": "Original packaging missing",
            "functionalityAssessment": "Touch interface likely compromised",
            "repairCostBracket": "high",
            "fraudSignals": [],
            "confidenceScore": 0.98,
            "summary": "Severe glass fracture detected. Unsuitable for direct P2P resale."
        }
        return mock_response
        
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
            "reasoning": f"Fallback Rule Engine: Routed to {pathway} based on Grade {grade} and MSRP {msrp}"
        }

if __name__ == "__main__":
    ai_client = GeminiAIIntegrations()
    print("\n--- 1. Gemini Assessment ---")
    print(json.dumps(ai_client.inspect_product_condition(["dGVzdA=="]), indent=2))
