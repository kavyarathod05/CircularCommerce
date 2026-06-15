"""
Test endpoints that don't require authentication
"""

import requests
import sys

BASE_URL = "http://localhost:8000"

print("="*60)
print("Testing Public Endpoints (No Auth Required)")
print("="*60)

tests = [
    ("Health Check", "GET", "/health"),
    ("Catalog", "GET", "/catalog"),
]

passed = 0
failed = 0

for name, method, endpoint in tests:
    try:
        url = f"{BASE_URL}{endpoint}"
        resp = requests.get(url, timeout=10)
        
        if resp.status_code == 200:
            print(f"✅ {name}")
            passed += 1
        else:
            print(f"❌ {name} - HTTP {resp.status_code}")
            failed += 1
    except Exception as e:
        print(f"❌ {name} - {str(e)[:50]}")
        failed += 1

print("-"*60)
print(f"\n📊 Results: {passed} passed, {failed} failed")

if failed == 0:
    print("🎉 All public endpoints working!")
    print("\nℹ️  Note: Most new endpoints require authentication.")
    print("To test authenticated endpoints:")
    print("1. Register: POST /auth/register")
    print("2. Login: POST /auth/login")
    print("3. Use the JWT token in Authorization header")
    sys.exit(0)
else:
    print("⚠️ Some endpoints failed.")
    sys.exit(1)
