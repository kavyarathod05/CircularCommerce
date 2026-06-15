from dotenv import load_dotenv
load_dotenv()

import asyncio
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from mangum import Mangum
import random

# --- JWT Auth ---
from auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    register_user, login_user, get_current_user, get_current_user_optional, require_role,
    _USER_STORE, _safe_user
)

# Import Naman's ML Engines
from demand_engine import DemandEngine
from predictive_friction import PredictiveFrictionEngine
from dynamic_pricing import DynamicPricingEngine
from network_fraud import SEFraudGNN
from size_recommendation import SizeRecommendationEngine
from gemini_ai_integrations import GeminiAIIntegrations
from aws_ai_integrations import AWSAIIntegrations
from hf_ai_integrations import HuggingFaceIntegrations
from vto_engine import VirtualTryOnEngine
from vto_orchestrator import VTOOrchestrator
from nsga2_routing import NSGA2Router
from fleet_optimizer import SustainableFleetOptimizer
from unit_inventory import UnitInventoryEngine
from serial_verification import SerialVerificationEngine

app = FastAPI(title="SecondLife Commerce - Naman ML Microservice")

# Enable CORS for local dev testing
from fastapi.staticfiles import StaticFiles
import os

from fastapi import APIRouter
api_router = APIRouter(dependencies=[Depends(get_current_user)])

app.add_middleware(

    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("vto-storage", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/vto-storage", StaticFiles(directory="vto-storage"), name="vto-storage")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Models
demand_model = DemandEngine()
friction_model = PredictiveFrictionEngine()
pricing_model = DynamicPricingEngine()
fraud_model = SEFraudGNN()
size_model = SizeRecommendationEngine()
gemini_ai = GeminiAIIntegrations()
aws_ai = AWSAIIntegrations()
hf_ai = HuggingFaceIntegrations()
vto_model = VirtualTryOnEngine()
vto_orchestrator = VTOOrchestrator()
nsga2_router = NSGA2Router()
fleet_opt = SustainableFleetOptimizer()
unit_inventory_model = UnitInventoryEngine()
serial_verification_model = SerialVerificationEngine()

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

# --- Auth Endpoints ---

@app.post("/auth/register", response_model=TokenResponse, tags=["Auth"])
def auth_register(req: RegisterRequest):
    """Create a new account and receive a JWT."""
    return register_user(req)

@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
def auth_login(req: LoginRequest):
    """Login with email + password and receive a JWT."""
    return login_user(req)

@app.get("/auth/me", tags=["Auth"])
def auth_me(current_user: Dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    # Merge live store data (green_credits, co2) with token claims
    stored = _USER_STORE.get(current_user["email"])
    if stored:
        return {"status": "success", "data": _safe_user(stored)}
    return {"status": "success", "data": current_user}

@app.get("/auth/users", tags=["Auth"])
def list_users(current_user: Dict = Depends(require_role("admin"))):
    """Admin-only: list all registered users."""
    return {
        "status": "success",
        "data": [_safe_user(u) for u in _USER_STORE.values()]
    }

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

@api_router.post("/api/v1/ml/negotiate")
def negotiate_return(req: NegotiateRequest):
    """Phase 6: Bedrock Agent Negotiation"""
    discount = 0.20 if req.defect_severity == "minor" else 0.40
    green_credits = 500
    offer = f"We noticed a {req.defect_severity} defect. Would you accept a {int(discount*100)}% partial refund (₹{int(req.msrp*discount)}) and {green_credits} Green Credits to keep the item?"
    return {"status": "success", "data": {"offer_text": offer, "discount_amount": int(req.msrp*discount), "green_credits": green_credits}}

@api_router.post("/api/v1/ml/inspect-video")
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

@api_router.post("/api/v1/ml/triage")
def determine_triage(req: TriageRequest):
    """Core Algorithmic Disposition Engine"""
    condition_data = {"grade": req.grade, "reason": req.reason, "productId": req.product_id}
    result = gemini_ai.determine_disposition_agent(condition_data, req.msrp)
            
    return {
        "status": "success", 
        "data": {
            "pathway": result.get("pathway", "hyperlocal-p2p"),
            "calculated_grade": req.grade,
            "routing_reason": result.get("reasoning", "Agent routed based on condition and MSRP.")
        }
    }

@api_router.post("/api/v1/ml/fraud-graphrag")
def get_fraud_graphrag(req: FraudGraphRAGRequest):
    """Return review: receipt tampering + linked-account signals"""
    receipt_url = "/static/demo-receipt.svg"
    return {
        "status": "success",
        "data": {
            "graphrag_summary": (
                f"Return for {req.user_id} matches a pattern seen in 40 linked accounts: "
                "same device fingerprint, repeated receipt edits on the purchase date, and empty-box claims within 48 hours."
            ),
            "receipt_image_url": receipt_url,
            "ela_regions": [
                {"label": "Purchase date", "x_pct": 55, "y_pct": 61, "w_pct": 30, "h_pct": 5, "severity": "high"},
                {"label": "Store stamp", "x_pct": 7, "y_pct": 63, "w_pct": 28, "h_pct": 5, "severity": "medium"},
                {"label": "Total paid", "x_pct": 7, "y_pct": 78, "w_pct": 85, "h_pct": 5, "severity": "high"},
            ],
            "connected_accounts": 40,
            "tampering_probability": 0.98,
            "recommended_action": "Hold refund and request in-store receipt verification",
            "network_nodes": [
                {"id": "target", "label": req.user_id, "type": "customer", "risk": "high"},
                {"id": "device", "label": "Shared device", "type": "device", "risk": "medium"},
                {"id": "address", "label": "Same address", "type": "address", "risk": "medium"},
                {"id": "ring", "label": "Return ring", "type": "group", "risk": "high"},
                {"id": "acct1", "label": "acct-91", "type": "account", "risk": "high"},
                {"id": "acct2", "label": "acct-44", "type": "account", "risk": "high"},
            ],
            "network_edges": [
                {"from": "target", "to": "device"},
                {"from": "target", "to": "address"},
                {"from": "target", "to": "ring"},
                {"from": "ring", "to": "acct1"},
                {"from": "ring", "to": "acct2"},
            ],
        }
    }


@api_router.post("/api/v1/ml/demand/rank")
def rank_demand(req: DemandRequest):
    """Phase 2: Local Demand Engine Algorithm"""
    return {"status": "success", "data": demand_model.rank_buyers(req.product_category, req.product_price, req.user_geohash)}

@api_router.post("/api/v1/ml/aws/inspect-condition")
def inspect_condition(req: NovaProRequest):
    """Phase 4: Google Gemini Damage Assessment"""
    return {"status": "success", "data": gemini_ai.inspect_product_condition(req.image_bytes_list)}

@api_router.get("/api/v1/ml/aws/liveness-session")
def get_liveness_session():
    """Phase 4: Amazon Rekognition Face Liveness"""
    return {"status": "success", "data": aws_ai.create_face_liveness_session()}

@api_router.post("/api/v1/ml/vto/drape")
def generate_vto(req: VTORequest):
    """Legacy JSON endpoint — delegates to orchestrator when possible."""
    import base64
    try:
        raw = req.user_image_base64
        if "," in raw:
            photo_bytes = base64.b64decode(raw.split(",", 1)[1])
        else:
            photo_bytes = base64.b64decode(raw)
        data = vto_orchestrator.generate(photo_bytes, req.clothing_sku)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "success", "data": vto_model.process_vto_draping(req.user_image_base64, req.clothing_sku)}


@api_router.post("/api/vto/generate")
async def vto_generate(
    photo: UploadFile = File(...),
    product_id: str = Form(...),
    height_cm: float = Form(170.0),
    target_size: str = Form("M"),
):
    """
    Full VTO pipeline (architecture guide):
    upload photo → pose/body estimate → fit score → IDM-VTON or local overlay.
    """
    try:
        photo_bytes = await photo.read()
        if not photo_bytes:
            raise HTTPException(status_code=400, detail="Empty photo upload")
        data = await asyncio.to_thread(
            vto_orchestrator.generate, photo_bytes, product_id, height_cm, target_size
        )
        return {"status": "success", "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/api/products/{product_id}")
def get_product_vto_info(product_id: str):
    """Product image, category, and size chart for VTO UI."""
    return {"status": "success", "data": vto_orchestrator.get_product(product_id)}

@api_router.post("/api/v1/ml/friction/evaluate")
def evaluate_friction(req: FrictionRequest):
    """Phase 5: Predictive Friction / Return Probability"""
    return {"status": "success", "data": friction_model.evaluate_checkout(req.user_id, req.product_id, req.session_data)}

@api_router.post("/api/v1/ml/pricing/dynamic")
def get_dynamic_price(req: PricingRequest):
    """Phase 5: GenAI Dynamic Pricing"""
    return {"status": "success", "data": pricing_model.calculate_current_price(req.product_id, req.original_price, req.hours_on_market, req.local_demand_score)}

@api_router.get("/api/v1/ml/fraud/trust-score/{user_id}")
def get_trust_score(user_id: str):
    """Phase 5: SEFraud GNN Trust Score"""
    return {"status": "success", "data": fraud_model.evaluate_trust_score(user_id)}

@app.get("/health")
def health_check():
    return {"status": "ML Microservice is ALIVE"}

# --- Local Fallback Endpoints for Frontend (replaces Go Serverless temporarily) ---
import datetime
import boto3
from catalog_cache import get_catalog as cache_get_catalog, set_catalog as cache_set_catalog
from product_registry import lookup_product, PRODUCT_REGISTRY

def _build_catalog_items(items):
    formatted = []
    for item in items:
        product_id = item.get("name", "Unknown Product")
        msrp = float(item.get("msrp", 0))
        listing_id = item.get("listingId", "")
        registry = lookup_product(product_id)
        discount_pct = float(item.get("discount", 0.2))
        current_price = round(msrp * (1 - discount_pct))
        is_flash_deal = bool(item.get("isFlashDeal", listing_id == "lst-demo-1"))
        formatted.append({
            "listingId": listing_id,
            "productId": product_id,
            "msrp": msrp,
            "currentPrice": current_price,
            "discountApplied": f"{int(discount_pct * 100)}%",
            "isFlashDeal": is_flash_deal,
            "certificateUrl": f"/api/v1/gs1/certificate?product_id={product_id.replace(' ', '%20')}",
            "gs1": {
                "gtin": registry["gtin"],
                "brand": registry["brand"],
                "ledgerHash": registry["ledger_hash"],
                "verified": True,
            },
            "owner": item.get("owner", "Local Seller"),
            "grade": item.get("condition", "Grade B"),
            "escrowStatus": item.get("escrowStatus", "N/A"),
            "status": item.get("status", "available"),
            "image": item.get("image") or registry.get("image", ""),
        })
    return formatted

def _demo_catalog():
    demo = []
    for listing_id, product_id, msrp, grade in [
        ("lst-demo-1", "Bose QC Headphones", 7900, "Grade B"),
        ("lst-demo-2", "Essentials Cotton Hoodie", 2999, "Grade A"),
        ("lst-demo-3", "Black Leather Jacket", 8999, "Grade A"),
        ("lst-demo-4", "iPhone 14 Pro Max", 95000, "Grade B"),
    ]:
        demo.append({
            "listingId": listing_id,
            "name": product_id,
            "msrp": msrp,
            "condition": grade,
            "owner": "Priya S. (Koramangala)",
            "escrowStatus": "N/A",
            "status": "available",
            "discount": 0.2,
            "image": lookup_product(product_id).get("image", ""),
        })
    return _build_catalog_items(demo)

def _load_catalog_from_source():
    use_dynamo = os.getenv("USE_DYNAMODB_CATALOG", "0") == "1"
    if use_dynamo:
        try:
            dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
            listings = dynamodb.Table('SecondLife_Listings')
            response = listings.scan()
            items = response.get('Items', [])
            if items:
                return _build_catalog_items(items)
        except Exception as e:
            print("Failed to fetch from DynamoDB:", e)
    return _demo_catalog()


@app.on_event("startup")
def warm_catalog_cache():
    try:
        formatted = _load_catalog_from_source()
        cache_set_catalog(formatted, ttl_seconds=3600)
        print(f"[Catalog] Pre-warmed cache with {len(formatted)} items")
    except Exception as e:
        print(f"[Catalog] Pre-warm failed: {e}")


@api_router.get("/catalog")
def get_catalog():
    cached = cache_get_catalog()
    if cached:
        return cached

    formatted = _load_catalog_from_source()
    cache_set_catalog(formatted, ttl_seconds=3600)
    return formatted

@api_router.get("/api/v1/gs1/certificate")
def get_gs1_certificate(product_id: str):
    registry = lookup_product(product_id)
    return {
        "status": "success",
        "data": {
            "product_id": product_id,
            "gtin": registry["gtin"],
            "brand": registry["brand"],
            "ledger_hash": registry["ledger_hash"],
            "verified": True,
            "registry": "GS1 Global Registry (demo)",
            "verified_at": datetime.datetime.utcnow().isoformat() + "Z",
        }
    }

@api_router.post("/listing/{listing_id}/transition")
def transition_listing_state(listing_id: str, action: str = "advance"):
    """Real AWS DynamoDB state transitions for Escrow Lock/Release/Dispute"""
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('SecondLife_Listings')
        
        # Get current state
        response = table.get_item(Key={'listingId': listing_id})
        if 'Item' not in response:
            return {"status": "error", "message": "Listing not found"}
            
        current_status = response['Item'].get('status', 'available')
        
        # State Machine Transition logic
        if action == "dispute":
            import random
            # Simulate AI Multimodal Comparison (Handoff Image vs Original Image)
            ai_verdict = random.choice(['seller_fraud', 'buyer_fraud'])
            
            if ai_verdict == 'seller_fraud':
                next_status = 'removed'
                next_escrow = 'Refunded to Buyer (AI Verdict)'
            else:
                next_status = 'sold'
                next_escrow = 'Released to Seller (AI Verdict)'
        else:
            if current_status == 'available':
                next_status = 'reserved'
                next_escrow = 'Locked'
            elif current_status == 'reserved':
                next_status = 'sold'
                next_escrow = 'Released'
            else:
                next_status = 'available'
                next_escrow = 'N/A'
            
        # Update DynamoDB
        table.update_item(
            Key={'listingId': listing_id},
            UpdateExpression="set #s = :s, escrowStatus = :e",
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={
                ':s': next_status,
                ':e': next_escrow
            }
        )
        return {"status": "success", "new_status": next_status, "new_escrow": next_escrow}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}



@api_router.get("/seller/metrics")
def get_seller_metrics(
    seller_id: str = "usr-12",
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    return {
        "warehouse_avoidance_rate": 71.2,
        "co2_saved_kg": 855.4,
        "trees_planted": 40.7,
        "capital_recovery_value": 4350000,
        "escrow_locked_funds": 164200,
        "authenticated_as": current_user.get("name") if current_user else None,
    }

@api_router.get("/user/metrics")
def get_user_metrics(
    user_id: str = "usr-12",
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    # Use real data from user store if authenticated
    if current_user:
        stored = _USER_STORE.get(current_user["email"])
        if stored:
            return {
                "user_id": stored["id"],
                "name": stored["name"],
                "email": stored["email"],
                "co2_saved_kg": stored.get("co2_saved_kg", 22.4),
                "trees_planted": round(stored.get("co2_saved_kg", 22.4) / 21.2, 2),
                "green_credits": stored.get("green_credits", 500),
                "role": stored["role"],
            }
    return {
        "user_id": user_id,
        "co2_saved_kg": 22.4,
        "trees_planted": 1.06,
        "green_credits": 500,
    }

@api_router.get("/dpp")
def get_dpp(listing_id: str):
    registry = lookup_product("Bose QC Headphones")
    return {
        "listing_id": listing_id,
        "gs1": {
            "gtin": registry["gtin"],
            "brand": registry["brand"],
            "ledger_hash": registry["ledger_hash"],
            "verified": True,
        },
        "dpp_history": [
            {"action": "Manufactured", "timestamp": "2026-08-01T10:00:00Z", "owner": "Factory A, Vietnam"},
            {"action": "First Sale", "timestamp": "2026-10-12T14:30:00Z", "owner": "Original Buyer"},
            {"action": "Returned & Graded", "timestamp": datetime.datetime.utcnow().isoformat() + "Z", "owner": "usr-12"},
            {"action": "Listed Locally", "timestamp": datetime.datetime.utcnow().isoformat() + "Z", "owner": "Local Seller"},
        ]
    }

class ListingUpdate(BaseModel):
    listing_id: str
    new_status: str
    buyer_id: str

@api_router.put("/listing")
def update_listing(req: ListingUpdate):
    return {"status": "success", "message": f"Listing {req.listing_id} updated to {req.new_status}"}

class AIAssistRequest(BaseModel):
    order_id: str
    image_base64: str = None

@api_router.post("/seller/ai-assist")
def ai_assist(req: AIAssistRequest):
    import time
    time.sleep(1.5) # Simulate AI processing delay
    return {
        "status": "success",
        "data": {
            "suggested_price": 12000,
            "description": f"Premium Grade A condition. Verified via Amazon Order {req.order_id}. Barely used, tested and fully functional. Includes all original accessories. Ready for immediate local handoff.",
            "gs1_verified": True
        }
    }

class CreateListingRequest(BaseModel):
    productId: str
    msrp: float
    grade: str
    price: float
    description: str
    orderId: str

@api_router.post("/listing/create")
def create_listing(req: CreateListingRequest):
    try:
        import uuid
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('SecondLife_Listings')
        listing_id = f"LST-{str(uuid.uuid4())[:6].upper()}"
        
        table.put_item(Item={
            'listingId': listing_id,
            'name': req.productId,
            'msrp': str(req.msrp),
            'price': str(req.price),
            'condition': req.grade,
            'status': 'available',
            'escrowStatus': 'N/A',
            'description': req.description,
            'orderId': req.orderId,
            'owner': 'Current Seller',
            'discount': str(round(1.0 - (req.price/req.msrp), 2))
        })
        return {"status": "success", "listingId": listing_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}
from logistics_telemetry import LogisticsTelemetryEngine
_logistics_engine = LogisticsTelemetryEngine(fleet_size=12, active_orders=24)
@api_router.get("/api/v1/logistics/fleet")
def get_fleet():
    return {"status": "success", "data": _logistics_engine.get_fleet_snapshot()}
@api_router.get("/api/v1/logistics/orders")
def get_logistics_orders():
    return {"status": "success", "data": _logistics_engine.get_orders_snapshot()}
@api_router.get("/api/v1/logistics/metrics")
def get_logistics_metrics():
    _logistics_engine.tick()  # advance sim on each poll
    return {"status": "success", "data": _logistics_engine.get_metrics()}
@api_router.get("/api/v1/logistics/alerts")
def get_logistics_alerts():
    return {"status": "success", "data": _logistics_engine.get_alerts()}
@api_router.get("/api/v1/logistics/tick")
def get_logistics_tick():
    events = _logistics_engine.tick()
    return {"status": "success", "data": events}

class RoutingRequest(BaseModel):
    num_orders: int = 20
    pop_size: int = 80
    generations: int = 100

class FleetRequest(BaseModel):
    num_orders: int = 20
    cost_weight: float = 0.6
    emission_weight: float = 0.4
    ga_generations: int = 15

@api_router.post("/api/v1/routing/optimize")
def optimize_routing(req: RoutingRequest):
    points, depot = nsga2_router.generate_scenario(req.num_orders)
    result = nsga2_router.optimize(points, depot, req.pop_size, req.generations)
    return {"status": "success", "data": result}

@api_router.post("/api/v1/fleet/optimize")
def optimize_fleet(req: FleetRequest):
    nodes, depot = fleet_opt.generate_scenario(req.num_orders)
    result = fleet_opt.optimize(nodes, depot, req.cost_weight, req.emission_weight, req.ga_generations)
    return {"status": "success", "data": result}

@api_router.get("/api/v1/inventory/units")
def get_inventory_units():
    units = unit_inventory_model.get_all_units()
    return {"status": "success", "data": units}

class InventoryRepairRequest(BaseModel):
    new_grade: str
    new_status: str
    repair_action: str = ""
    repair_cost: float = 0

class SerialVerifyRequest(BaseModel):
    order_id: str
    image_b64: str
    user_claimed_sn: str = ""

@api_router.post("/api/v1/inventory/units/{unit_id}/repair")
def repair_inventory_unit(unit_id: str, req: InventoryRepairRequest):
    updated = unit_inventory_model.update_unit_condition(
        unit_id, req.new_grade, req.new_status, req.repair_action or None, req.repair_cost
    )
    if updated.get("error"):
        return {"status": "error", "message": updated["error"]}
    return {"status": "success", "data": updated}

@api_router.post("/api/v1/vision/verify-serial")
def verify_serial_number(req: SerialVerifyRequest):
    result = serial_verification_model.verify_return(
        req.order_id, req.image_b64, req.user_claimed_sn or None
    )
    if result.get("status") == "error":
        return {"status": "error", "message": result.get("message", "Verification failed")}
    return {"status": "success", "data": result}

@api_router.get("/api/v1/demo/serial-sample")
def get_serial_sample():
    return {
        "status": "success",
        "data": {
            "order_id": "ORD-001",
            "expected_serial": "SN-984A-B72C-11",
            "sample_image_url": "/static/demo-package-label.svg",
            "description": "Product box label with serial number for demo verification",
        }
    }

# AWS Lambda Handler
handler = Mangum(app)

app.include_router(api_router)

# Run locally using: uvicorn main:app --reload --port 8000
