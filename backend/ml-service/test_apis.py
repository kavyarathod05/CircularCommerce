import urllib.request
import urllib.parse
import json
import base64

BASE_URL = "http://18.212.212.69"

def make_request(method, endpoint, payload=None):
    url = f"{BASE_URL}{endpoint}"
    print(f"\n--- Testing {method} {endpoint} ---")
    
    headers = {'Content-Type': 'application/json'}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("SUCCESS! Output:")
            print(json.dumps(result, indent=2))
            return True
    except urllib.error.HTTPError as e:
        print(f"FAILED (HTTP Error {e.code}):")
        try:
            print(json.loads(e.read().decode('utf-8')))
        except:
            print(e.read().decode('utf-8'))
        return False
    except Exception as e:
        print(f"FAILED (Error): {e}")
        return False

def get_base64_image(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            image_data = response.read()
            return base64.b64encode(image_data).decode('utf-8')
    except Exception as e:
        print(f"Failed to fetch image: {e}")
        # Return a 1x1 pixel base64 as fallback
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

def run_all_tests():
    print("Fetching sample image...")
    # Using a reliable placeholder image
    sample_image_b64 = get_base64_image("https://via.placeholder.com/150")
    
    tests = [
        {
            "method": "GET",
            "endpoint": "/health",
            "payload": None
        },
        {
            "method": "POST",
            "endpoint": "/api/v1/ml/aws/inspect-condition",
            "payload": {
                "image_bytes_list": [sample_image_b64]
            }
        },
        {
            "method": "GET",
            "endpoint": "/api/v1/ml/aws/liveness-session",
            "payload": None
        },
        {
            "method": "POST",
            "endpoint": "/api/v1/ml/demand/rank",
            "payload": {
                "product_category": "electronics",
                "product_price": 1200.0,
                "user_geohash": "gcpvj"
            }
        },
        {
            "method": "POST",
            "endpoint": "/api/v1/ml/friction/evaluate",
            "payload": {
                "user_id": "usr-123",
                "product_id": "p-hoodie",
                "session_data": {
                    "multiple_sizes_in_cart": True,
                    "dwell_time_seconds": 15
                }
            }
        },
        {
            "method": "POST",
            "endpoint": "/api/v1/ml/pricing/dynamic",
            "payload": {
                "product_id": "p-smartphone",
                "original_price": 1000.0,
                "hours_on_market": 48.0,
                "local_demand_score": 0.2
            }
        },
        {
            "method": "POST",
            "endpoint": "/api/v1/ml/vto/drape",
            "payload": {
                "user_image_base64": sample_image_b64,
                "clothing_sku": "SKU-TSHIRT-1"
            }
        },
        {
            "method": "GET",
            "endpoint": "/api/v1/ml/fraud/trust-score/usr-123",
            "payload": None
        }
    ]

    success_count = 0
    for t in tests:
        res = make_request(t['method'], t['endpoint'], t['payload'])
        if res:
            success_count += 1
            
    print(f"\n=================================")
    print(f"Tests Complete: {success_count}/{len(tests)} endpoints returned 200 OK.")
    print(f"=================================")

if __name__ == "__main__":
    run_all_tests()
