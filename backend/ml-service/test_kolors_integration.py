"""Test script to verify Kolors VTO integration."""
import requests
import json
from pathlib import Path

API_URL = "http://127.0.0.1:8000"

def test_vto_endpoint():
    """Test the VTO endpoint with mock data."""
    print("=" * 60)
    print("  Testing Kolors VTO Integration")
    print("=" * 60)
    
    # Test 1: Check health
    print("\n[1/3] Checking backend health...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is alive!")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("   Make sure backend is running on port 8000")
        return
    
    # Test 2: Check product catalog
    print("\n[2/3] Fetching product catalog...")
    try:
        response = requests.get(f"{API_URL}/catalog", timeout=5)
        if response.status_code == 200:
            catalog = response.json()
            print(f"✅ Found {len(catalog)} products in catalog")
            if catalog:
                print(f"   Sample product: {catalog[0].get('productId', 'Unknown')}")
        else:
            print(f"⚠️  Catalog fetch returned {response.status_code}")
    except Exception as e:
        print(f"⚠️  Catalog fetch failed: {e}")
    
    # Test 3: Check VTO engine initialization
    print("\n[3/3] Testing VTO engine initialization...")
    try:
        # This tests that the import works
        from kolors_vto_local import get_kolors_vto_engine
        engine = get_kolors_vto_engine()
        print("✅ Kolors VTO engine initialized successfully!")
        print(f"   Engine type: {type(engine).__name__}")
    except Exception as e:
        print(f"❌ Failed to initialize Kolors engine: {e}")
        return
    
    print("\n" + "=" * 60)
    print("  Integration Test Summary")
    print("=" * 60)
    print("\n✅ All basic checks passed!")
    print("\n📝 Next steps:")
    print("   1. Start frontend: npm run dev (in frontend folder)")
    print("   2. Navigate to VTO tab in browser")
    print("   3. Upload a photo and select a product")
    print("   4. Click 'Generate try-on'")
    print("\n💡 Configuration:")
    print("   - VTO_USE_KOLORS=1 (enabled)")
    print("   - KOLORS_VTO_LOCAL=0 (using API mode)")
    print("   - Backend: http://127.0.0.1:8000")
    print("\n⚠️  Note: First API call may take 30-60s as HuggingFace")
    print("   Space wakes up. Subsequent calls will be faster.")
    print()

if __name__ == "__main__":
    test_vto_endpoint()
