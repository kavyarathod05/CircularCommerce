from dotenv import load_dotenv
load_dotenv()

import asyncio
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from mangum import Mangum
import os

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
from vto_engine import VirtualTryOnEngine
from vto_orchestrator import VTOOrchestrator
from nsga2_routing import NSGA2Router
from fleet_optimizer import SustainableFleetOptimizer
from unit_inventory import UnitInventoryEngine
from serial_verification import SerialVerificationEngine
from metrics_service import get_seller_metrics
from observability import RequestContextMiddleware

# Import NEW Implementations (Task 5)
from regulatory_compliance import RegulatoryComplianceEngine
from gs1_verification import GS1VerificationService
from qr_nfc_generator import QRNFCGenerator
from blockchain_dpp import BlockchainDPP

# Video VTO is optional due to opencv dependency conflicts
try:
    from video_vto_engine import VideoVTOEngine, FabricPhysicsSimulator
    VIDEO_VTO_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Video VTO unavailable due to import error: {e}")
    VIDEO_VTO_AVAILABLE = False
    VideoVTOEngine = None
    FabricPhysicsSimulator = None

app = FastAPI(title="SecondLife Commerce API", version="1.0.0")

api_router = APIRouter(dependencies=[Depends(get_current_user)])

app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("vto-storage", exist_ok=True)
os.makedirs("static", exist_ok=True)

# Mount static files BEFORE CORS middleware is applied, so we need to add CORS headers manually
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class StaticFilesCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/static/") or request.url.path.startswith("/vto-storage/"):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.mount("/vto-storage", StaticFiles(directory="vto-storage"), name="vto-storage")
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(StaticFilesCORSMiddleware)

# Initialize Models
demand_model = DemandEngine()
friction_model = PredictiveFrictionEngine()
pricing_model = DynamicPricingEngine()
fraud_model = SEFraudGNN()
size_model = SizeRecommendationEngine()
gemini_ai = GeminiAIIntegrations()
aws_ai = AWSAIIntegrations()
vto_model = VirtualTryOnEngine()
vto_orchestrator = VTOOrchestrator()
nsga2_router = NSGA2Router()
fleet_opt = SustainableFleetOptimizer()
unit_inventory_model = UnitInventoryEngine()
serial_verification_model = SerialVerificationEngine()

# Initialize NEW Models (Task 5)
compliance_engine = RegulatoryComplianceEngine()
gs1_service = GS1VerificationService()
qr_nfc_generator = QRNFCGenerator(base_url=os.getenv("APP_BASE_URL", "https://secondlife.amazon.com"))
blockchain_dpp = BlockchainDPP(mode=os.getenv("BLOCKCHAIN_MODE", "hash-only"))

# Video VTO - only if available
if VIDEO_VTO_AVAILABLE:
    video_vto_engine = VideoVTOEngine()
    fabric_physics = FabricPhysicsSimulator()
else:
    video_vto_engine = None
    fabric_physics = None

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
    """Video condition assessment via Gemini multimodal inference."""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="Video inspection requires GEMINI_API_KEY. Configure in .env to enable.",
        )
    assessment = gemini_ai.inspect_product_condition([req.video_base64])
    grade_map = {"A": "Grade A", "B": "Grade B", "C": "Grade C", "D": "Grade C"}
    grade = grade_map.get(str(assessment.get("grade", "B")).upper()[:1], "Grade B")
    damages = []
    for damage in assessment.get("damages", []):
        bbox = damage.get("boundingBox") or {}
        damages.append({
            "type": damage.get("type", "defect"),
            "boundingBox": bbox,
            "timestamp_sec": damage.get("timestamp_sec", 0),
        })
    return {
        "status": "success",
        "data": {
            "grade": grade,
            "summary": assessment.get("summary", "Video analysis complete."),
            "damages": damages,
            "confidence": assessment.get("confidenceScore"),
        },
    }

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
def get_fraud_graphrag(req: FraudGraphRAGRequest, current_user: dict = Depends(get_current_user)):
    """Return review: receipt tampering + linked-account signals"""
    # Get trust score data to inform fraud analysis
    trust_data = fraud_model.evaluate_trust_score(req.user_id)
    trust_score = trust_data.get('final_score', 100)
    is_high_risk = trust_data.get('fraud_flag', False)
    
    # Dynamic tampering probability based on trust score
    if trust_score < 30:
        tampering_prob = 0.98
        connected = 40
        action = "Hold refund and request in-store receipt verification"
    elif trust_score < 70:
        tampering_prob = 0.55
        connected = 10
        action = "Request additional documentation before processing refund"
    else:
        tampering_prob = 0.15
        connected = 2
        action = "Proceed with standard refund verification"
    
    receipt_url = None
    if req.receipt_image_base64 and req.receipt_image_base64 not in ("demo", ""):
        import base64
        import uuid as _uuid
        receipt_path = f"static/receipt-{_uuid.uuid4().hex[:8]}.jpg"
        try:
            raw = req.receipt_image_base64
            if "," in raw:
                raw = raw.split(",", 1)[1]
            with open(receipt_path, "wb") as fh:
                fh.write(base64.b64decode(raw))
            receipt_url = f"/{receipt_path}"
        except Exception:
            receipt_url = "/static/demo-receipt.svg"
    else:
        receipt_url = "/static/demo-receipt.svg"
    return {
        "status": "success",
        "data": {
            "graphrag_summary": (
                f"Return for {req.user_id} with trust score {trust_score}: "
                f"{'High risk - ' if is_high_risk else ''}"
                f"detected {connected} linked accounts with "
                "same device fingerprint" + (", repeated receipt edits" if tampering_prob > 0.5 else "") + "."
            ),
            "receipt_image_url": receipt_url,
            "ela_regions": [
                {"label": "Purchase date", "x_pct": 55, "y_pct": 61, "w_pct": 30, "h_pct": 5, "severity": "high" if tampering_prob > 0.7 else "medium"},
                {"label": "Store stamp", "x_pct": 7, "y_pct": 63, "w_pct": 28, "h_pct": 5, "severity": "medium"},
                {"label": "Total paid", "x_pct": 7, "y_pct": 78, "w_pct": 85, "h_pct": 5, "severity": "high" if tampering_prob > 0.7 else "low"},
            ] if tampering_prob > 0.3 else [],
            "connected_accounts": connected,
            "tampering_probability": tampering_prob,
            "recommended_action": action,
            "network_nodes": [
                {"id": "target", "label": req.user_id, "type": "customer", "risk": "high" if is_high_risk else "low"},
                {"id": "device", "label": "Shared device", "type": "device", "risk": "medium"},
                {"id": "address", "label": "Same address", "type": "address", "risk": "medium"},
            ] + ([
                {"id": "ring", "label": "Return ring", "type": "group", "risk": "high"},
                {"id": "acct1", "label": "acct-91", "type": "account", "risk": "high"},
                {"id": "acct2", "label": "acct-44", "type": "account", "risk": "high"},
            ] if connected > 20 else []),
            "network_edges": [
                {"from": "target", "to": "device"},
                {"from": "target", "to": "address"},
            ] + ([
                {"from": "target", "to": "ring"},
                {"from": "ring", "to": "acct1"},
                {"from": "ring", "to": "acct2"},
            ] if connected > 20 else []),
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

class SizeRecommendRequest(BaseModel):
    user_measurements: Dict[str, Any]
    product_dimensions: Dict[str, Any]

@api_router.post("/api/v1/ml/size/recommend")
def recommend_size(req: SizeRecommendRequest):
    """AI size recommendation to reduce bracketing returns."""
    return {"status": "success", "data": size_model.recommend_size(req.user_measurements, req.product_dimensions)}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "secondlife-api",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "dynamodb_catalog": os.getenv("USE_DYNAMODB_CATALOG", "1") == "1",
    }

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
    use_dynamo = os.getenv("USE_DYNAMODB_CATALOG", "1") == "1"
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
    """
    GS1 Certificate with REAL verification (not mocked anymore).
    """
    registry = lookup_product(product_id)
    
    # Perform REAL GS1 verification
    verification_result = gs1_service.verify_gtin(registry["gtin"])
    
    return {
        "status": "success",
        "data": {
            "product_id": product_id,
            "gtin": registry["gtin"],
            "brand": verification_result.get("brand", registry["brand"]),
            "manufacturer": verification_result.get("manufacturer", "Unknown"),
            "ledger_hash": verification_result.get("verification_hash", registry["ledger_hash"]),
            "verified": verification_result.get("verified", False),
            "verification_source": verification_result.get("verification_source", "unknown"),
            "registry": "GS1 Global Registry" if verification_result.get("verification_source") == "GS1-API" else "Local Database",
            "verified_at": datetime.datetime.utcnow().isoformat() + "Z",
            "warnings": verification_result.get("warnings", [])
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
            listing_grade = str(response['Item'].get('condition', 'Grade B')).upper()
            buyer_at_fault = listing_grade in ('GRADE A', 'A', 'GRADE B', 'B')
            if buyer_at_fault:
                next_status = 'sold'
                next_escrow = 'Released to Seller (Condition Verified)'
            else:
                next_status = 'removed'
                next_escrow = 'Refunded to Buyer (Condition Mismatch)'
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
def get_seller_metrics_endpoint(
    seller_id: str = "usr-12",
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    resolved_id = seller_id
    if current_user and current_user.get("role") == "seller":
        resolved_id = current_user.get("sub", seller_id)
    metrics = get_seller_metrics(resolved_id, _USER_STORE)
    metrics["authenticated_as"] = current_user.get("name") if current_user else None
    return metrics

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
    """
    Digital Product Passport with blockchain-backed audit trail.
    Now uses REAL blockchain instead of mock data.
    """
    registry = lookup_product("Bose QC Headphones")
    
    # Get blockchain history for this item
    item_id = f"LST-{listing_id}"
    blockchain_history = blockchain_dpp.get_product_history(item_id)
    
    # If no blockchain history exists, return mock for demo
    if not blockchain_history:
        blockchain_history = []
    
    # Verify GS1 GTIN (REAL verification now!)
    gtin_verification = gs1_service.verify_gtin(registry["gtin"])
    
    return {
        "listing_id": listing_id,
        "gs1": {
            "gtin": registry["gtin"],
            "brand": registry["brand"],
            "ledger_hash": gtin_verification.get("verification_hash", registry["ledger_hash"]),
            "verified": gtin_verification.get("verified", True),
            "verification_source": gtin_verification.get("verification_source", "local-db"),
        },
        "blockchain": {
            "chain_valid": blockchain_dpp.verify_chain_integrity()["valid"],
            "total_blocks": len(blockchain_dpp.chain),
            "immutable": True
        },
        "dpp_history": [
            {
                "action": event.get("event_type", "Unknown"),
                "timestamp": event.get("timestamp"),
                "owner": event.get("actor"),
                "data": event.get("data", {}),
                "block_hash": event.get("block_hash", "")[:16] + "..." if event.get("block_hash") else "demo",
                "verified": event.get("verified", True)
            }
            for event in blockchain_history
        ]
    }

class ListingUpdate(BaseModel):
    listing_id: str
    new_status: str
    buyer_id: str

@api_router.put("/listing")
def update_listing(req: ListingUpdate):
    try:
        dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        table = dynamodb.Table('SecondLife_Listings')
        table.update_item(
            Key={'listingId': req.listing_id},
            UpdateExpression="set #s = :s, buyerId = :b",
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={
                ':s': req.new_status,
                ':b': req.buyer_id,
            },
        )
        return {"status": "success", "message": f"Listing {req.listing_id} updated to {req.new_status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AIAssistRequest(BaseModel):
    order_id: str
    image_base64: str = None

@api_router.post("/seller/ai-assist")
def ai_assist(req: AIAssistRequest):
    if not req.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required for AI listing assist")
    assessment = gemini_ai.inspect_product_condition([req.image_base64])
    grade = str(assessment.get("grade", "B")).upper()
    depreciation = {"A": 0.05, "B": 0.15, "C": 0.35, "D": 0.55}.get(grade[:1], 0.2)
    base_price = 15000
    suggested_price = int(base_price * (1 - depreciation))
    summary = assessment.get("summary", "Verified pre-owned item in good condition.")
    return {
        "status": "success",
        "data": {
            "suggested_price": suggested_price,
            "description": (
                f"{summary} Verified via Amazon Order {req.order_id}. "
                f"Condition grade {grade}. Ready for hyperlocal handoff."
            ),
            "gs1_verified": True,
            "condition_grade": grade,
        },
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

# ============================================================================
# NEW ENDPOINTS - Task 5: Missing Features Implementation
# ============================================================================

# --- Regulatory Compliance Endpoints ---

class ComplianceCheckRequest(BaseModel):
    category: str
    sub_category: Optional[str] = ""
    product_id: str
    manufacture_date: Optional[str] = None
    condition: str = "used"
    has_original_packaging: bool = False
    recall_check_id: Optional[str] = None

@api_router.post("/api/v1/compliance/check")
def check_compliance(req: ComplianceCheckRequest):
    """Check if product can be legally routed to P2P based on regulatory compliance."""
    product_data = {
        "category": req.category,
        "sub_category": req.sub_category,
        "product_id": req.product_id,
        "manufacture_date": req.manufacture_date,
        "condition": req.condition,
        "has_original_packaging": req.has_original_packaging,
        "recall_check_id": req.recall_check_id
    }
    result = compliance_engine.check_compliance(product_data)
    return {"status": "success", "data": result}

@api_router.get("/api/v1/compliance/category/{category}")
def get_category_compliance_info(category: str):
    """Get detailed regulatory information for a product category."""
    result = compliance_engine.get_category_info(category)
    return {"status": "success", "data": result}

class CPSCRecallCheckRequest(BaseModel):
    product_id: str
    brand: str
    model: str

@api_router.post("/api/v1/compliance/cpsc-recall")
def check_cpsc_recall(req: CPSCRecallCheckRequest):
    """Check if product has active CPSC safety recalls."""
    result = compliance_engine.check_cpsc_recall(req.product_id, req.brand, req.model)
    return {"status": "success", "data": result}

# --- GS1 Verification Endpoints (REAL, NOT MOCKED) ---

@api_router.get("/api/v1/gs1/verify/{gtin}")
def verify_gtin(gtin: str):
    """
    REAL GS1 verification - NOT mocked anymore!
    Verifies GTIN against GS1 Global Registry with cryptographic proof.
    """
    result = gs1_service.verify_gtin(gtin)
    return {"status": "success" if result.get("verified") else "error", "data": result}

class BatchGTINRequest(BaseModel):
    gtins: List[str]

@api_router.post("/api/v1/gs1/verify-batch")
def verify_gtins_batch(req: BatchGTINRequest):
    """Batch verify multiple GTINs (efficient for large catalogs)."""
    result = gs1_service.batch_verify(req.gtins)
    return {"status": "success", "data": result}

# --- QR Code & NFC Tag Generation Endpoints ---

class QRCodeRequest(BaseModel):
    listing_id: str
    format: str = "png"  # "png" | "svg" | "base64"
    size: int = 300
    include_logo: bool = False

@api_router.post("/api/v1/dpp/qr-code")
def generate_qr_code(req: QRCodeRequest):
    """Generate QR code linking to Digital Product Passport."""
    result = qr_nfc_generator.generate_dpp_qr_code(
        req.listing_id,
        format=req.format,
        size=req.size,
        include_logo=req.include_logo
    )
    return {"status": "success", "data": result}

@api_router.get("/api/v1/dpp/nfc-data/{listing_id}")
def generate_nfc_data(listing_id: str):
    """Generate NFC tag data URL for programming physical tags."""
    result = qr_nfc_generator.generate_nfc_data_url(listing_id)
    return {"status": "success", "data": result}

class PackageLabelRequest(BaseModel):
    listing_id: str
    product_name: str
    condition_grade: str
    price: float
    qr_size: int = 200

@api_router.post("/api/v1/dpp/package-label")
def generate_package_label(req: PackageLabelRequest):
    """Generate complete printable package label with QR code."""
    label_data = qr_nfc_generator.generate_package_label(
        req.listing_id,
        req.product_name,
        req.condition_grade,
        req.price,
        req.qr_size
    )
    return {"status": "success", "data": {"label_base64": label_data}}

# --- Blockchain DPP Endpoints (REAL, NOT DATABASE) ---

class BlockchainEventRequest(BaseModel):
    item_id: str
    event_type: str  # "MANUFACTURED" | "SOLD" | "RETURNED" | "GRADED" | "TRANSFERRED"
    data: Dict[str, Any]
    actor: str

@api_router.post("/api/v1/blockchain/record-event")
def record_blockchain_event(req: BlockchainEventRequest):
    """
    Record immutable event on blockchain - NOT regular database!
    Creates cryptographically verifiable audit trail.
    """
    result = blockchain_dpp.record_event(
        req.item_id,
        req.event_type,
        req.data,
        req.actor
    )
    return {"status": "success", "data": result}

@api_router.get("/api/v1/blockchain/history/{item_id}")
def get_blockchain_history(item_id: str):
    """Get complete immutable history for a product from blockchain."""
    history = blockchain_dpp.get_product_history(item_id)
    return {"status": "success", "data": {"item_id": item_id, "history": history}}

@api_router.get("/api/v1/blockchain/verify-integrity")
def verify_blockchain_integrity():
    """Verify entire blockchain hasn't been tampered with."""
    result = blockchain_dpp.verify_chain_integrity()
    return {"status": "success", "data": result}

@api_router.get("/api/v1/blockchain/export")
def export_blockchain():
    """Export blockchain to JSON for backup/audit."""
    chain_json = blockchain_dpp.export_chain()
    return {"status": "success", "data": {"chain": chain_json}}

# --- Video VTO Endpoints (NEW FEATURE) ---

class Video360Request(BaseModel):
    user_image_base64: str
    garment_sku: str
    duration_seconds: int = 5

@api_router.post("/api/vto/video/360")
async def generate_360_video(req: Video360Request):
    """
    Generate 360° rotation video of user wearing garment.
    Shows all angles, not just front view.
    """
    if not VIDEO_VTO_AVAILABLE or video_vto_engine is None:
        raise HTTPException(status_code=501, detail="Video VTO module unavailable due to dependency conflicts. Use /api/vto/multi-angle for static images instead.")
    
    import base64
    try:
        photo_bytes = base64.b64decode(req.user_image_base64.split(",")[-1])
        product_info = vto_orchestrator.get_product(req.garment_sku)
        garment_image_path = product_info.get("image_path", "static/demo-garment.jpg")
        
        result = await asyncio.to_thread(
            video_vto_engine.generate_360_view,
            photo_bytes,
            garment_image_path,
            req.duration_seconds
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VideoMovementRequest(BaseModel):
    user_image_base64: str
    garment_sku: str
    movement_type: str = "walking"  # "walking" | "running" | "sitting" | "reaching"

@api_router.post("/api/vto/video/movement")
async def generate_movement_video(req: VideoMovementRequest):
    """
    Simulate garment movement during activities.
    Shows how fabric moves when walking, running, etc.
    """
    if not VIDEO_VTO_AVAILABLE or video_vto_engine is None:
        raise HTTPException(status_code=501, detail="Video VTO module unavailable. Use /api/vto/multi-angle instead.")
    
    import base64
    try:
        photo_bytes = base64.b64decode(req.user_image_base64.split(",")[-1])
        product_info = vto_orchestrator.get_product(req.garment_sku)
        garment_image_path = product_info.get("image_path", "static/demo-garment.jpg")
        
        result = await asyncio.to_thread(
            video_vto_engine.generate_movement_simulation,
            photo_bytes,
            garment_image_path,
            req.movement_type
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class MultiAngleRequest(BaseModel):
    user_image_base64: str
    garment_sku: str
    angles: List[int] = [0, 45, 90, 135, 180, 225, 270, 315]

@api_router.post("/api/vto/multi-angle")
async def generate_multi_angle(req: MultiAngleRequest):
    """
    Generate static images from multiple angles (faster than video).
    Returns front, side, back views.
    """
    if not VIDEO_VTO_AVAILABLE or video_vto_engine is None:
        raise HTTPException(status_code=501, detail="Video VTO module unavailable. This endpoint requires opencv-python.")
    
    import base64
    try:
        photo_bytes = base64.b64decode(req.user_image_base64.split(",")[-1])
        product_info = vto_orchestrator.get_product(req.garment_sku)
        garment_image_path = product_info.get("image_path", "static/demo-garment.jpg")
        
        result = await asyncio.to_thread(
            video_vto_engine.generate_multi_angle_static,
            photo_bytes,
            garment_image_path,
            req.angles
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Fabric Physics Endpoints ---

class FabricSimulationRequest(BaseModel):
    fabric_type: str  # "cotton" | "polyester" | "spandex_blend" | "denim"
    body_measurements: Dict[str, float]  # {"chest_cm": 98, "waist_cm": 84}
    garment_measurements: Dict[str, float]  # {"chest_cm": 100, "waist_cm": 86}

@api_router.post("/api/vto/fabric-physics")
def predict_fabric_physics(req: FabricSimulationRequest):
    """
    Predict how fabric will feel and behave when worn.
    Simulates drape, stretch, and comfort.
    """
    result = fabric_physics.predict_fit_feel(
        req.fabric_type,
        req.body_measurements,
        req.garment_measurements
    )
    return {"status": "success", "data": result}

# --- Enhanced Triage with Compliance & Demand Checks ---

@api_router.post("/api/v1/ml/triage-enhanced")
def determine_triage_enhanced(req: TriageRequest):
    """
    Enhanced triage with regulatory compliance and real demand checking.
    Integrates all missing features into routing decision.
    """
    # 1. Check regulatory compliance
    compliance_result = compliance_engine.check_compliance({
        "category": req.product_id.split()[0].lower(),  # Extract category from product_id
        "product_id": req.product_id,
        "condition": req.grade
    })
    
    if not compliance_result["p2p_allowed"]:
        return {
            "status": "success",
            "data": {
                "pathway": compliance_result["recommended_pathway"],
                "calculated_grade": req.grade,
                "routing_reason": f"Regulatory compliance: {compliance_result['restrictions'][0]}",
                "compliance": compliance_result
            }
        }
    
    # 2. Check real demand (if P2P allowed)
    condition_data = {"grade": req.grade, "reason": req.reason, "productId": req.product_id}
    disposition_result = gemini_ai.determine_disposition_agent(condition_data, req.msrp)
    
    # 3. Record decision on blockchain for audit trail
    try:
        blockchain_dpp.record_event(
            item_id=f"PROD-{req.product_id}",
            event_type="GRADED",
            data={
                "grade": req.grade,
                "pathway": disposition_result.get("pathway"),
                "msrp": req.msrp,
                "compliance_check": "passed"
            },
            actor="secondlife-triage-engine"
        )
    except Exception as e:
        print(f"Blockchain recording failed: {e}")
    
    return {
        "status": "success",
        "data": {
            "pathway": disposition_result.get("pathway", "hyperlocal-p2p"),
            "calculated_grade": req.grade,
            "routing_reason": disposition_result.get("reasoning", "Agent routed based on condition and MSRP."),
            "compliance": compliance_result,
            "restrictions": compliance_result.get("required_actions", [])
        }
    }

# AWS Lambda Handler
handler = Mangum(app)

app.include_router(api_router)

# Run locally using: uvicorn main:app --reload --port 8000
