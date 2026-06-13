from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

# Import Naman's ML Engines
from demand_engine import DemandEngine
from predictive_friction import PredictiveFrictionEngine
from dynamic_pricing import DynamicPricingEngine
from network_fraud import SEFraudGNN
from size_recommendation import SizeRecommendationEngine
from aws_ai_integrations import AWSAIIntegrations
from vto_engine import VirtualTryOnEngine

app = FastAPI(title="SecondLife Commerce - Naman ML Microservice")

# Initialize Models
demand_model = DemandEngine()
friction_model = PredictiveFrictionEngine()
pricing_model = DynamicPricingEngine()
fraud_model = SEFraudGNN()
fraud_model.build_mock_graph()
size_model = SizeRecommendationEngine()
aws_ai = AWSAIIntegrations()
vto_model = VirtualTryOnEngine()

# --- Request Models ---
class DemandRequest(BaseModel):
    product_category: str
    product_price: float
    candidate_ids: List[str]

class FrictionRequest(BaseModel):
    user_history: Dict[str, Any]
    product_specs: Dict[str, Any]
    session_data: Dict[str, Any]

class PricingRequest(BaseModel):
    original_price: float
    hours_on_market: float
    local_demand_score: float
    competitor_prices: List[float]

class VTORequest(BaseModel):
    user_image_base64: str
    clothing_sku: str

class NovaProRequest(BaseModel):
    image_bytes_list: List[str]

# --- API Endpoints ---

@app.post("/api/v1/ml/demand/rank")
def rank_demand(req: DemandRequest):
    """Phase 2: Local Demand Engine Algorithm"""
    return {"status": "success", "data": demand_model.rank_buyers(req.product_category, req.product_price, req.candidate_ids)}

@app.post("/api/v1/ml/aws/inspect-condition")
def inspect_condition(req: NovaProRequest):
    """Phase 4: Amazon Nova Pro Damage Assessment"""
    return {"status": "success", "data": aws_ai.inspect_product_condition_nova_pro(req.image_bytes_list)}

@app.get("/api/v1/ml/aws/liveness-session")
def get_liveness_session():
    """Phase 4: Amazon Rekognition Face Liveness"""
    return {"status": "success", "data": aws_ai.create_face_liveness_session()}

@app.post("/api/v1/ml/vto/drape")
def generate_vto(req: VTORequest):
    """Phase 5: Virtual Try-On Engine (Diffusion-GAN)"""
    return {"status": "success", "data": vto_model.process_vto_draping(req.user_image_base64, req.clothing_sku)}

@app.post("/api/v1/ml/friction/evaluate")
def evaluate_friction(req: FrictionRequest):
    """Phase 5: Predictive Friction / Return Probability"""
    return {"status": "success", "data": friction_model.evaluate_checkout(req.user_history, req.product_specs, req.session_data)}

@app.post("/api/v1/ml/pricing/dynamic")
def get_dynamic_price(req: PricingRequest):
    """Phase 5: GenAI Dynamic Pricing"""
    return {"status": "success", "data": pricing_model.calculate_current_price(req.original_price, req.hours_on_market, req.local_demand_score, req.competitor_prices)}

@app.get("/api/v1/ml/fraud/trust-score/{user_id}")
def get_trust_score(user_id: str):
    """Phase 5: SEFraud GNN Trust Score"""
    return {"status": "success", "data": fraud_model.evaluate_trust_score(user_id)}

@app.get("/health")
def health_check():
    return {"status": "ML Microservice is ALIVE"}

# Run locally using: uvicorn main:app --reload --port 8000
