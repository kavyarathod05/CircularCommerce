import json
import urllib.request
import urllib.error

# Configs
AWS_API_BASE = "https://7fwutbh0wh.execute-api.us-east-1.amazonaws.com/Prod"
ML_API_BASE = "http://localhost:8000"

def run_http_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_headers = dict(response.info())
            res_body = response.read().decode("utf-8")
            return response.status, res_headers, json.loads(res_body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, dict(e.info()), json.loads(body)
        except Exception:
            return e.code, dict(e.info()), body
    except urllib.error.URLError as e:
        return 0, {}, {"error": str(e.reason)}

def print_result(component, test_name, status, response, headers=None):
    status_icon = "[SUCCESS]" if status in [200, 201] else "[FAILED]"
    print(f"[{component}] {test_name}: {status_icon} (Status: {status})")
    
    if headers:
        # Check CORS
        cors_origin = headers.get("access-control-allow-origin") or headers.get("Access-Control-Allow-Origin")
        print(f"    - CORS Access-Control-Allow-Origin: {cors_origin or 'Missing'}")
    
    if "error" in response or status not in [200, 201]:
        print(f"    - Details/Error: {response}")
    print("-" * 60)

def test_aws_backend():
    print("\n=== TESTING LIVE AWS GO BACKEND ===")
    
    # 1. Test /return/media-url pre-signed URL generation (GET)
    status, headers, body = run_http_request(f"{AWS_API_BASE}/return/media-url?filename=test.jpg", "GET")
    print_result("AWS", "Generate S3 Pre-signed URL (/return/media-url)", status, body, headers)
    
    # 2. Test /return/intercept logic (POST)
    mock_intercept_payload = {
        "order_id": "999-65432-1789",
        "product_id": "p-smartphone-premium",
        "user_id": "usr-test-12",
        "reason": "damaged",
        "lat": 12.9716,
        "lng": 77.5946,
        "media_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"
    }
    status, headers, body = run_http_request(f"{AWS_API_BASE}/return/intercept", "POST", data=mock_intercept_payload)
    print_result("AWS", "Ingest Return Intercept (/return/intercept)", status, body, headers)

def test_ml_microservice():
    print("\n=== TESTING LOCAL ML FASTAPI MICROSERVICE ===")
    
    # 1. Health Check
    status, headers, body = run_http_request(f"{ML_API_BASE}/health", "GET")
    if status == 0:
        print("[ML] Local FastAPI Server is OFFLINE or not running.")
        print("    -> Run it using: uvicorn main:app --reload --port 8000 inside the 'ml-models' directory.")
        print("-" * 60)
        return
        
    print_result("ML", "Health Check (/health)", status, body)
    
    # 2. Demand Ranking
    demand_payload = {
        "product_category": "electronics",
        "product_price": 7900.0,
        "candidate_ids": ["usr-buyer1", "usr-buyer2"]
    }
    status, headers, body = run_http_request(f"{ML_API_BASE}/api/v1/ml/demand/rank", "POST", data=demand_payload)
    print_result("ML", "Local Demand Ranking (/api/v1/ml/demand/rank)", status, body)
    
    # 3. Inspect Condition (Nova Pro)
    nova_payload = {"image_bytes_list": ["dummy_base64_data"]}
    status, headers, body = run_http_request(f"{ML_API_BASE}/api/v1/ml/aws/inspect-condition", "POST", data=nova_payload)
    print_result("ML", "Nova Pro Damage Assessment (/api/v1/ml/aws/inspect-condition)", status, body)
    
    # 4. Rekognition Face Liveness
    status, headers, body = run_http_request(f"{ML_API_BASE}/api/v1/ml/aws/liveness-session", "GET")
    print_result("ML", "Rekognition Face Liveness Session (/api/v1/ml/aws/liveness-session)", status, body)
    
    # 5. Virtual Try-On (VTO)
    vto_payload = {"user_image_base64": "dummy", "clothing_sku": "SKU-H-10"}
    status, headers, body = run_http_request(f"{ML_API_BASE}/api/v1/ml/vto/drape", "POST", data=vto_payload)
    print_result("ML", "VTO Draping Simulation (/api/v1/ml/vto/drape)", status, body)
    
    # 6. Predictive Friction
    friction_payload = {
        "user_history": {"returns_count": 4},
        "product_specs": {"size": "L"},
        "session_data": {"dwell_time_seconds": 120}
    }
    status, headers, body = run_http_request(f"{ML_API_BASE}/api/v1/ml/friction/evaluate", "POST", data=friction_payload)
    print_result("ML", "Predictive Friction Check (/api/v1/ml/friction/evaluate)", status, body)
    
    # 7. Dynamic Pricing
    pricing_payload = {
        "original_price": 5000.0,
        "hours_on_market": 48.0,
        "local_demand_score": 0.8,
        "competitor_prices": [4800.0, 4900.0]
    }
    status, headers, body = run_http_request(f"{ML_API_BASE}/api/v1/ml/pricing/dynamic", "POST", data=pricing_payload)
    print_result("ML", "GenAI Dynamic Pricing (/api/v1/ml/pricing/dynamic)", status, body)
    
    # 8. SEFraud GNN Trust Score
    status, headers, body = run_http_request(f"{ML_API_BASE}/api/v1/ml/fraud/trust-score/usr-kavya", "GET")
    print_result("ML", "SEFraud GNN Trust Score (/api/v1/ml/fraud/trust-score/{user_id})", status, body)

if __name__ == "__main__":
    print("============================================================")
    print("         SECONDLIFE COMMERCE - INTEGRATION TEST SUITE       ")
    print("============================================================")
    test_aws_backend()
    test_ml_microservice()
