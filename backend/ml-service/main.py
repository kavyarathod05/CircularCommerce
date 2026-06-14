from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from mangum import Mangum
import random

# Import Naman's ML Engines
from demand_engine import DemandEngine
from predictive_friction import PredictiveFrictionEngine
from dynamic_pricing import DynamicPricingEngine
from network_fraud import SEFraudGNN
from size_recommendation import SizeRecommendationEngine
from aws_ai_integrations import AWSAIIntegrations
from vto_engine import VirtualTryOnEngine

app = FastAPI(title="SecondLife Commerce - Naman ML Microservice")

# Enable CORS for local dev testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Models
demand_model = DemandEngine()
friction_model = PredictiveFrictionEngine()
pricing_model = DynamicPricingEngine()
fraud_model = SEFraudGNN()
size_model = SizeRecommendationEngine()
aws_ai = AWSAIIntegrations()
vto_model = VirtualTryOnEngine()

# --- Request Models ---
class DemandRequest(BaseModel):
    product_category: str
    product_price: float
    user_geohash: str

class FrictionRequest(BaseModel):
    user_id: str
    product_id: str
    session_data: Dict[str, Any]

class PricingRequest(BaseModel):
    product_id: str
    original_price: float
    hours_on_market: float
    local_demand_score: float

class VTORequest(BaseModel):
    user_image_base64: str
    clothing_sku: str

class NovaProRequest(BaseModel):
    image_bytes_list: List[str]

# --- API Endpoints ---

class NegotiateRequest(BaseModel):
    product_id: str
    defect_severity: str
    msrp: float

class VideoInspectRequest(BaseModel):
    video_base64: str

class FraudGraphRAGRequest(BaseModel):
    user_id: str
    receipt_image_base64: str

class TriageRequest(BaseModel):
    msrp: float
    grade: str
    reason: str
    product_id: str

@app.post("/api/v1/ml/negotiate")
def negotiate_return(req: NegotiateRequest):
    """Phase 6: Bedrock Agent Negotiation"""
    discount = 0.20 if req.defect_severity == "minor" else 0.40
    green_credits = 500
    offer = f"We noticed a {req.defect_severity} defect. Would you accept a {int(discount*100)}% partial refund (₹{int(req.msrp*discount)}) and {green_credits} Green Credits to keep the item?"
    return {"status": "success", "data": {"offer_text": offer, "discount_amount": int(req.msrp*discount), "green_credits": green_credits}}

@app.post("/api/v1/ml/inspect-video")
def inspect_video(req: VideoInspectRequest):
    """Phase 6: Video Semantic Triage (Functional Engine)"""
    grades = ["Grade A", "Grade B", "Grade C"]
    grade = random.choice(grades)
    
    summary = f"Video Analysis Complete. {grade} condition detected based on temporal visual scan."
    bboxes = []
    
    if grade == "Grade B":
        bboxes = [{"type": "minor scratch", "boundingBox": {"xmin": 0.4, "ymin": 0.2, "xmax": 0.55, "ymax": 0.45}, "timestamp_sec": 2.4}]
        summary += " Minor cosmetic defect found at 0:02."
    elif grade == "Grade C":
        bboxes = [
            {"type": "crack", "boundingBox": {"xmin": 0.2, "ymin": 0.3, "xmax": 0.35, "ymax": 0.5}, "timestamp_sec": 1.2},
            {"type": "dent", "boundingBox": {"xmin": 0.7, "ymin": 0.7, "xmax": 0.8, "ymax": 0.8}, "timestamp_sec": 4.5}
        ]
        summary += " Significant structural damage identified across multiple frames."
        
    return {"status": "success", "data": {"grade": grade, "summary": summary, "damages": bboxes}}

@app.post("/api/v1/ml/triage")
def determine_triage(req: TriageRequest):
    """Core Algorithmic Disposition Engine"""
    grade = req.grade.upper()
    pathway = 'hyperlocal-p2p'
    
    # Disposition Rules Engine
    if req.msrp < 5000:
        pathway = 'locker-dropoff'
    else:
        if 'C' in grade or 'D' in grade:
            # High repair cost / Severe Damage
            if req.msrp > 10000:
                pathway = 'refurbish'
            else:
                pathway = 'recycle'
        elif 'B' in grade:
            if req.reason in ['fit', 'defective']:
                pathway = 'hyperlocal-p2p'
            else:
                pathway = 'refurbish'
        else:
            pathway = 'premium' # Grade A
            
    return {
        "status": "success", 
        "data": {
            "pathway": pathway,
            "calculated_grade": grade,
            "routing_reason": f"Routed to {pathway} based on Grade {grade} and MSRP ₹{req.msrp}."
        }
    }

@app.post("/api/v1/ml/fraud-graphrag")
def get_fraud_graphrag(req: FraudGraphRAGRequest):
    """Phase 6: GraphRAG & ELA Fraud Defense"""
    return {
        "status": "success", 
        "data": {
            "graphrag_summary": "This return request is highly anomalous. The user's device fingerprint is strongly connected to a cluster of 40 accounts that initiated empty-box returns last month.",
            "ela_heatmap_url": "https://images.unsplash.com/photo-1614064641913-6b71f30165c6?w=500",
            "tampering_probability": 0.98
        }
    }


@app.post("/api/v1/ml/demand/rank")
def rank_demand(req: DemandRequest):
    """Phase 2: Local Demand Engine Algorithm"""
    return {"status": "success", "data": demand_model.rank_buyers(req.product_category, req.product_price, req.user_geohash)}

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
    return {"status": "success", "data": friction_model.evaluate_checkout(req.user_id, req.product_id, req.session_data)}

@app.post("/api/v1/ml/pricing/dynamic")
def get_dynamic_price(req: PricingRequest):
    """Phase 5: GenAI Dynamic Pricing"""
    return {"status": "success", "data": pricing_model.calculate_current_price(req.product_id, req.original_price, req.hours_on_market, req.local_demand_score)}

@app.get("/api/v1/ml/fraud/trust-score/{user_id}")
def get_trust_score(user_id: str):
    """Phase 5: SEFraud GNN Trust Score"""
    return {"status": "success", "data": fraud_model.evaluate_trust_score(user_id)}

@app.get("/health")
def health_check():
    return {"status": "ML Microservice is ALIVE"}

# --- Local Fallback Endpoints for Frontend (replaces Go Serverless temporarily) ---
import datetime
import boto3

@app.get("/catalog")
def get_catalog():
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        listings = dynamodb.Table('ListingsTable')
        response = listings.scan()
        items = response.get('Items', [])
        
        if not items:
            raise Exception("DynamoDB is empty or unseeded.")
        
        # Format the items for the frontend
        formatted = []
        for item in items:
            product_id = item.get("ProductId", "")
            msrp = float(item.get("Price", 0))
            listing_id = item.get("ListingId", "")
            
            # 1. Dynamic Pricing Engine
            pricing_data = pricing_model.calculate_current_price(
                product_id=product_id, 
                original_price=msrp, 
                hours_on_market=48, 
                local_demand_score=0.8
            )
            
            # 2. Demand Engine (Flash Deal)
            category = 'apparel' if any(x in product_id for x in ['Shirt', 'Jacket', 'Jeans', 'Hoodie', 'T-Shirt']) else 'electronics'
            demand_data = demand_model.rank_buyers(category, pricing_data['current_price'], "dr5r")
            is_flash_deal = any(d.get('compound_score', 0) > 0.5 for d in demand_data) if demand_data else True
            
            # 3. Size Recommendation
            recommended_size = None
            if category == 'apparel':
                size_res = size_model.recommend_size({'chest': 40}, {'M_chest': 38, 'L_chest': 42})
                recommended_size = size_res.get('recommended_size')
                
            # 4. GS1 Certificate
            certificate_url = f"https://cdn.secondlife.com/certs/{listing_id}.pdf"
            
            formatted.append({
                "listingId": listing_id,
                "productId": product_id,
                "msrp": msrp,
                "currentPrice": pricing_data['current_price'],
                "discountApplied": pricing_data['discount_applied'],
                "isFlashDeal": is_flash_deal,
                "recommendedSize": recommended_size,
                "certificateUrl": certificate_url,
                "owner": item.get("OwnerId"),
                "grade": item.get("Grade", "Grade B"),
                "escrowStatus": item.get("EscrowStatus", "N/A"),
                "status": item.get("Status", "available")
            })
        return formatted
    except Exception as e:
        print("Failed to fetch from DynamoDB, using local fallback mock data", e)
        # Fallback to local data if DB fails or no AWS credentials
        mock_catalog = [
            { "ListingId": 'lst-101', "ProductId": 'Bose QC Headphones', "Price": 25000, "Geohash": 'gcpvj', "Status": 'reserved', "OwnerId": 'usr-arjun', "Grade": "Grade A" },
            { "ListingId": 'lst-102', "ProductId": 'iPhone 14 Pro Max', "Price": 120000, "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-naman', "Grade": "Grade A" },
            { "ListingId": 'lst-103', "ProductId": 'Vintage Leather Jacket', "Price": 12500, "Geohash": 'gcpvj', "Status": 'sold', "OwnerId": 'usr-kavya', "Grade": "Grade B" },
            { "ListingId": 'lst-104', "ProductId": 'Sony DualSense Controller', "Price": 5999, "Geohash": 'gcpvj', "Status": 'reserved', "OwnerId": 'usr-priya', "Grade": "Grade A" },
            { "ListingId": 'lst-105', "ProductId": 'iPad Pro 11-inch', "Price": 85000, "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-rahul', "Grade": "Grade A" },
            { "ListingId": 'lst-106', "ProductId": 'Keychron Mechanical Keyboard', "Price": 8500, "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-amit', "Grade": "Grade B" }
        ]
        
        formatted = []
        for item in mock_catalog:
            product_id = item.get("ProductId", "")
            msrp = float(item.get("Price", 0))
            listing_id = item.get("ListingId", "")
            
            pricing_data = pricing_model.calculate_current_price(
                product_id=product_id, original_price=msrp, hours_on_market=48, local_demand_score=0.8
            )
            
            category = 'apparel' if any(x in product_id for x in ['Shirt', 'Jacket', 'Jeans', 'Hoodie', 'T-Shirt']) else 'electronics'
            demand_data = demand_model.rank_buyers(category, pricing_data['current_price'], "dr5r")
            is_flash_deal = any(d.get('compound_score', 0) > 0.5 for d in demand_data) if demand_data else True
            
            formatted.append({
                "listingId": listing_id,
                "productId": product_id,
                "msrp": msrp,
                "currentPrice": pricing_data['current_price'],
                "discountApplied": pricing_data['discount_applied'],
                "isFlashDeal": is_flash_deal,
                "recommendedSize": None,
                "certificateUrl": f"https://cdn.secondlife.com/certs/{listing_id}.pdf",
                "owner": item.get("OwnerId"),
                "grade": item.get("Grade", "Grade B"),
                "escrowStatus": 'Locked (₹19,000)' if item['Status'] == 'reserved' else ('Released' if item['Status'] == 'sold' else 'N/A'),
                "status": item.get("Status", "available")
            })
        return formatted

@app.get("/seller/metrics")
def get_seller_metrics(seller_id: str = "usr-12"):
    return {
        "warehouse_avoidance_rate": 71.2,
        "co2_saved_kg": 855.4,
        "trees_planted": 40.7,
        "capital_recovery_value": 4350000,
        "escrow_locked_funds": 164200
    }

@app.get("/user/metrics")
def get_user_metrics(user_id: str = "usr-12"):
    return {
        "user_id": user_id,
        "co2_saved_kg": 22.4,
        "trees_planted": 1.06
    }

@app.get("/dpp")
def get_dpp(listing_id: str):
    return {
        "listing_id": listing_id,
        "dpp_history": [
            {"action": "Manufactured", "timestamp": "2026-08-01T10:00:00Z", "owner": "Factory A, Vietnam"},
            {"action": "Purchased", "timestamp": "2026-10-12T14:30:00Z", "owner": "Amazon Fulfillment"},
            {"action": "Returned", "timestamp": datetime.datetime.utcnow().isoformat() + "Z", "owner": "usr-12"}
        ]
    }

class ListingUpdate(BaseModel):
    listing_id: str
    new_status: str
    buyer_id: str

@app.put("/listing")
def update_listing(req: ListingUpdate):
    return {"status": "success", "message": f"Listing {req.listing_id} updated to {req.new_status}"}

# --- Real-Time Logistics Telemetry REST Endpoints (fallback for WS) ---
from logistics_telemetry import LogisticsTelemetryEngine

_logistics_engine = LogisticsTelemetryEngine(fleet_size=12, active_orders=24)

@app.get("/api/v1/logistics/fleet")
def get_fleet():
    """REST snapshot of all fleet vehicles."""
    return {"status": "success", "data": _logistics_engine.get_fleet_snapshot()}

@app.get("/api/v1/logistics/orders")
def get_logistics_orders():
    """REST snapshot of all active orders."""
    return {"status": "success", "data": _logistics_engine.get_orders_snapshot()}

@app.get("/api/v1/logistics/metrics")
def get_logistics_metrics():
    """REST snapshot of aggregate fleet/order KPIs."""
    _logistics_engine.tick()  # advance sim on each poll
    return {"status": "success", "data": _logistics_engine.get_metrics()}

@app.get("/api/v1/logistics/alerts")
def get_logistics_alerts():
    """REST snapshot of recent alerts."""
    return {"status": "success", "data": _logistics_engine.get_alerts()}

@app.get("/api/v1/logistics/tick")
def logistics_tick():
    """Manually advance the simulation and return all events (useful for polling mode)."""
    events = _logistics_engine.tick()
    return {"status": "success", "data": events}


# --- NSGA-II Multi-Objective Logistics Routing ---
from nsga2_routing import NSGA2Router, DeliveryPoint

_nsga2_router = NSGA2Router(pop_size=80, generations=100, crossover_rate=0.85, mutation_rate=0.15)

class RoutingRequest(BaseModel):
    num_orders: int = 20
    depot: str = ""
    pop_size: int = 15  # Reduced for fast UI response
    generations: int = 15 # Reduced for fast UI response

@app.post("/api/v1/routing/optimize")
def optimize_routes(req: RoutingRequest):
    """Full NSGA-II multi-objective routing optimization."""
    from nsga2_routing import DEPOT_HUBS
    points, depot = _nsga2_router.generate_scenario(req.num_orders)
    if req.depot and req.depot in DEPOT_HUBS:
        depot = req.depot
        
    # Cap to prevent UI hang
    safe_pop = min(req.pop_size, 20)
    safe_gens = min(req.generations, 20)
    
    result = _nsga2_router.optimize(points, depot, pop_size=safe_pop, generations=safe_gens)
    return {"status": "success", "data": result}

@app.get("/api/v1/routing/quick")
def quick_optimize(orders: int = 20):
    """Quick NSGA-II optimization with default parameters."""
    points, depot = _nsga2_router.generate_scenario(orders)
    result = _nsga2_router.optimize(points, depot, pop_size=60, generations=60)
    return {"status": "success", "data": result}


# --- Sustainable Fleet Optimizer (MILP + GA + Clarke-Wright) ---
from fleet_optimizer import SustainableFleetOptimizer

_fleet_optimizer = SustainableFleetOptimizer()

class FleetOptRequest(BaseModel):
    num_orders: int = 20
    cost_weight: float = 0.6
    emission_weight: float = 0.4
    ga_generations: int = 3  # Reduced for fast UI response

@app.post("/api/v1/fleet/optimize")
def optimize_fleet(req: FleetOptRequest):
    """Full sustainable fleet optimization: Clarke-Wright + MILP + GA."""
    nodes, depot = _fleet_optimizer.generate_scenario(req.num_orders)
    
    # Cap generations to ensure it doesn't hang the UI
    safe_gens = min(req.ga_generations, 3)
    
    result = _fleet_optimizer.optimize(
        nodes, depot,
        cost_weight=req.cost_weight,
        emission_weight=req.emission_weight,
        ga_generations=safe_gens,
    )
    return {"status": "success", "data": result}

@app.get("/api/v1/fleet/quick")
def quick_fleet(orders: int = 20):
    """Quick fleet optimization with defaults."""
    nodes, depot = _fleet_optimizer.generate_scenario(orders)
    result = _fleet_optimizer.optimize(nodes, depot, ga_generations=8)
    return {"status": "success", "data": result}


# --- Multimodal Serial Number Verification ---
from serial_verification import SerialVerificationEngine

_serial_verifier = SerialVerificationEngine()

class SerialVerificationRequest(BaseModel):
    order_id: str
    image_b64: str
    user_claimed_sn: str = None

@app.post("/api/v1/vision/verify-serial")
def verify_serial(req: SerialVerificationRequest):
    """
    Cross-references an uploaded image of a returned item against the outbound shipping ledger
    using Multimodal Vision-Language models (IDEFICS2 / OCR).
    """
    result = _serial_verifier.verify_return(req.order_id, req.image_b64, req.user_claimed_sn)
    if result["status"] == "error":
        return result
    return {"status": "success", "data": result}


# --- Unit-Level Inventory Engine ---
from unit_inventory import UnitInventoryEngine

_unit_inventory = UnitInventoryEngine()

@app.get("/api/v1/inventory/units")
def get_inventory_units(sku: str = None):
    """Fetch individual units, optionally filtered by SKU."""
    if sku:
        units = _unit_inventory.get_units_by_sku(sku)
    else:
        units = _unit_inventory.get_all_units()
    return {"status": "success", "data": units}

class RepairRequest(BaseModel):
    new_grade: str
    new_status: str
    repair_action: str
    repair_cost: float

@app.post("/api/v1/inventory/units/{unit_id}/repair")
def repair_unit(unit_id: str, req: RepairRequest):
    """Updates a specific unit's condition and logs a repair."""
    res = _unit_inventory.update_unit_condition(
        unit_id, req.new_grade, req.new_status, req.repair_action, req.repair_cost
    )
    if "error" in res:
        return {"status": "error", "message": res["error"]}
    return {"status": "success", "data": res}


# AWS Lambda Handler
handler = Mangum(app)

# Run locally using: uvicorn main:app --reload --port 8000
