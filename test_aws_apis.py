import requests
import time
import sys

BASE_URL = "http://107.23.164.138"

def print_result(api_name, success, expected, received):
    status = "PASS" if success else "FAIL"
    print(f"\n{status} - {api_name}")
    if not success:
        print(f"   Expected Data Structure: {expected}")
        print(f"   Received Data: {received}")

def wait_for_server():
    print("Waiting for AWS Backend to boot up...")
    for i in range(30):
        try:
            res = requests.get(f"{BASE_URL}/health", timeout=2)
            if res.status_code == 200:
                print("Server is ONLINE!")
                return True
        except:
            pass
        sys.stdout.write(".")
        sys.stdout.flush()
        time.sleep(5)
    print("\nServer failed to respond within 150 seconds.")
    return False

def test_catalog():
    api = "/catalog"
    try:
        res = requests.get(f"{BASE_URL}{api}")
        data = res.json()
        success = isinstance(data, list) and len(data) > 0 and 'productId' in data[0]
        print_result("Catalog API", success, "List of objects with 'productId'", list(data[0].keys()) if data else "Empty List")
    except Exception as e:
        print_result("Catalog API", False, "List of objects", str(e))

def test_routing():
    api = "/api/v1/routing/optimize"
    try:
        res = requests.post(f"{BASE_URL}{api}", json={"num_orders": 5})
        data = res.json()
        expected_keys = ['scenario', 'pareto_front']
        success = data.get('status') == 'success' and all(k in data.get('data', {}) for k in expected_keys)
        print_result("Routing Optimization", success, expected_keys, list(data.get('data', {}).keys()))
    except Exception as e:
        print_result("Routing Optimization", False, "JSON with Pareto metrics", str(e))

def test_friction():
    api = "/api/v1/ml/friction/evaluate"
    try:
        res = requests.post(f"{BASE_URL}{api}", json={"user_id": "u1", "product_id": "p1", "session_data": {"cart_size": 2, "return_velocity": 4}})
        data = res.json()
        success = data.get('status') == 'success' and 'returnProbability' in data.get('data', {})
        print_result("Friction Engine", success, "JSON with 'returnProbability'", list(data.get('data', {}).keys()))
    except Exception as e:
        print_result("Friction Engine", False, "JSON with metrics", str(e))

def test_fleet():
    api = "/api/v1/fleet/optimize"
    try:
        res = requests.post(f"{BASE_URL}{api}", json={"num_orders": 5})
        data = res.json()
        expected_keys = ['scenario', 'fleet_composition']
        success = data.get('status') == 'success' and all(k in data.get('data', {}) for k in expected_keys)
        print_result("Fleet Optimizer", success, expected_keys, list(data.get('data', {}).keys()))
    except Exception as e:
        print_result("Fleet Optimizer", False, "JSON with 'fleet_composition'", str(e))

if __name__ == "__main__":
    if wait_for_server():
        test_catalog()
        test_routing()
        test_friction()
        test_fleet()
