"""
Quick API Test - Verify server starts and critical endpoints work
"""

import subprocess
import time
import requests
import sys

print("="*60)
print("Quick API Test - Critical Endpoints")
print("="*60)

# Check if server is running
print("\n1. Checking if server is running...")
try:
    resp = requests.get("http://localhost:8000/health", timeout=2)
    if resp.status_code == 200:
        print("✅ Server is running")
    else:
        print("❌ Server returned error:", resp.status_code)
        sys.exit(1)
except requests.exceptions.ConnectionError:
    print("❌ Server is NOT running!")
    print("\nTo start the server, run:")
    print("  cd backend/ml-service")
    print("  uvicorn main:app --reload --port 8000")
    sys.exit(1)

# Test critical new endpoints (Note: Some require auth)
tests = [
    ("Health Check", "GET", "/health", None),
    ("Catalog (Public)", "GET", "/catalog", None),
]

passed = 0
failed = 0

print("\n2. Testing Critical Endpoints...")
print("-"*60)

for name, method, endpoint, payload in tests:
    try:
        url = f"http://localhost:8000{endpoint}"
        
        if method == "GET":
            resp = requests.get(url, timeout=10)
        else:
            resp = requests.post(url, json=payload, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success" or "data" in data:
                print(f"✅ {name}")
                passed += 1
            else:
                print(f"❌ {name} - Invalid response format")
                failed += 1
        else:
            print(f"❌ {name} - HTTP {resp.status_code}")
            failed += 1
    except Exception as e:
        print(f"❌ {name} - {str(e)[:50]}")
        failed += 1

print("-"*60)
print(f"\n📊 Results: {passed} passed, {failed} failed")

if failed == 0:
    print("🎉 All critical endpoints working!")
    sys.exit(0)
else:
    print("⚠️ Some endpoints failed. Check server logs.")
    sys.exit(1)
