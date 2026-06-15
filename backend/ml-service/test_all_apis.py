"""
SecondLife Commerce - Comprehensive API Testing Script
Tests all 23 new endpoints + existing endpoints
"""

import requests
import json
import time
from typing import Dict, Any
import base64

# Base URL
BASE_URL = "http://localhost:8000"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_result(test_name: str, success: bool, message: str = ""):
    """Log test result"""
    if success:
        test_results["passed"] += 1
        print(f"✅ PASS: {test_name}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {message}")
        print(f"❌ FAIL: {test_name} - {message}")

def test_health_check():
    """Test 0: Health Check"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        success = response.status_code == 200 and "ALIVE" in response.text
        log_result("Health Check", success, "" if success else f"Status: {response.status_code}")
    except Exception as e:
        log_result("Health Check", False, str(e))

# ============================================================================
# CATEGORY 1: REGULATORY COMPLIANCE (3 endpoints)
# ============================================================================

def test_compliance_electronics():
    """Test 1.1: Compliance Check - Electronics (Allowed)"""
    try:
        payload = {
            "category": "electronics",
            "product_id": "iPhone 14 Pro",
            "condition": "used"
        }
        response = requests.post(f"{BASE_URL}/api/v1/compliance/check", json=payload, timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            data.get("data", {}).get("p2p_allowed") == True
        )
        log_result("Compliance - Electronics (P2P Allowed)", success, 
                   "" if success else f"P2P allowed: {data.get('data', {}).get('p2p_allowed')}")
    except Exception as e:
        log_result("Compliance - Electronics", False, str(e))

def test_compliance_cosmetics():
    """Test 1.2: Compliance Check - Cosmetics (Blocked)"""
    try:
        payload = {
            "category": "cosmetics",
            "product_id": "REVLON-LIPSTICK-001",
            "condition": "opened"
        }
        response = requests.post(f"{BASE_URL}/api/v1/compliance/check", json=payload, timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            data.get("data", {}).get("p2p_allowed") == False and
            "FDA" in str(data.get("data", {}).get("restrictions", []))
        )
        log_result("Compliance - Cosmetics (P2P Blocked)", success,
                   "" if success else f"Should block P2P but got: {data.get('data', {}).get('p2p_allowed')}")
    except Exception as e:
        log_result("Compliance - Cosmetics", False, str(e))

def test_compliance_lithium_battery():
    """Test 1.3: Compliance Check - Lithium Battery (Conditional)"""
    try:
        payload = {
            "category": "lithium_batteries",
            "product_id": "BATTERY-PACK-18650",
            "condition": "used"
        }
        response = requests.post(f"{BASE_URL}/api/v1/compliance/check", json=payload, timeout=10)
        data = response.json()
        restrictions = data.get("data", {}).get("restrictions", [])
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            data.get("data", {}).get("p2p_allowed") == True and
            "ground_shipping_only" in restrictions
        )
        log_result("Compliance - Lithium Battery (Conditional)", success,
                   "" if success else f"Expected restrictions but got: {restrictions}")
    except Exception as e:
        log_result("Compliance - Lithium Battery", False, str(e))

def test_compliance_category_info():
    """Test 1.4: Get Category Compliance Info"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/compliance/category/car_seats", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            data.get("data", {}).get("p2p_allowed") == False
        )
        log_result("Compliance - Category Info (Car Seats)", success)
    except Exception as e:
        log_result("Compliance - Category Info", False, str(e))

def test_cpsc_recall_check():
    """Test 1.5: CPSC Recall Check"""
    try:
        payload = {
            "product_id": "FISHER-PRICE-ROCKER",
            "brand": "Fisher-Price",
            "model": "Rock n Play"
        }
        response = requests.post(f"{BASE_URL}/api/v1/compliance/cpsc-recall", json=payload, timeout=10)
        data = response.json()
        success = response.status_code == 200 and data.get("status") == "success"
        log_result("CPSC Recall Check", success)
    except Exception as e:
        log_result("CPSC Recall Check", False, str(e))

# ============================================================================
# CATEGORY 2: GS1 VERIFICATION (3 endpoints)
# ============================================================================

def test_gs1_verify_valid_gtin():
    """Test 2.1: GS1 Verify - Valid GTIN"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/gs1/verify/00614141083561", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            data.get("data", {}).get("verified") == True and
            data.get("data", {}).get("brand") == "Bose"
        )
        log_result("GS1 Verify - Valid GTIN (Bose)", success,
                   "" if success else f"Verified: {data.get('data', {}).get('verified')}")
    except Exception as e:
        log_result("GS1 Verify - Valid GTIN", False, str(e))

def test_gs1_verify_invalid_gtin():
    """Test 2.2: GS1 Verify - Invalid GTIN"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/gs1/verify/123ABC", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "error" and
            data.get("data", {}).get("verified") == False
        )
        log_result("GS1 Verify - Invalid GTIN", success,
                   "" if success else "Should return error for invalid format")
    except Exception as e:
        log_result("GS1 Verify - Invalid GTIN", False, str(e))

def test_gs1_batch_verify():
    """Test 2.3: GS1 Batch Verification"""
    try:
        payload = {
            "gtins": [
                "00614141083561",  # Bose - valid
                "00194253396839",  # Apple - valid
                "00999999999999"   # Unknown
            ]
        }
        response = requests.post(f"{BASE_URL}/api/v1/gs1/verify-batch", json=payload, timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            data.get("data", {}).get("verified") == 2 and
            data.get("data", {}).get("failed") == 1
        )
        log_result("GS1 Batch Verify", success,
                   "" if success else f"Expected 2 verified, 1 failed but got: {data.get('data')}")
    except Exception as e:
        log_result("GS1 Batch Verify", False, str(e))

def test_gs1_certificate():
    """Test 2.4: GS1 Certificate"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/gs1/certificate?product_id=Bose%20QC%20Headphones", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            data.get("data", {}).get("verified") == True
        )
        log_result("GS1 Certificate", success)
    except Exception as e:
        log_result("GS1 Certificate", False, str(e))

# ============================================================================
# CATEGORY 3: QR CODE & NFC GENERATION (3 endpoints)
# ============================================================================

def test_qr_code_png():
    """Test 3.1: QR Code Generation - PNG"""
    try:
        payload = {
            "listing_id": "LST-001",
            "format": "png",
            "size": 300,
            "include_logo": False
        }
        response = requests.post(f"{BASE_URL}/api/v1/dpp/qr-code", json=payload, timeout=10)
        data = response.json()
        qr_data = data.get("data", {}).get("qr_code_data", "")
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            len(qr_data) > 100 and  # QR code has data
            data.get("data", {}).get("dpp_url", "").endswith("/LST-001")
        )
        log_result("QR Code - PNG Format", success)
    except Exception as e:
        log_result("QR Code - PNG", False, str(e))

def test_qr_code_base64():
    """Test 3.2: QR Code Generation - Base64"""
    try:
        payload = {
            "listing_id": "LST-002",
            "format": "base64",
            "size": 300
        }
        response = requests.post(f"{BASE_URL}/api/v1/dpp/qr-code", json=payload, timeout=10)
        data = response.json()
        qr_data = data.get("data", {}).get("qr_code_data", "")
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            qr_data.startswith("data:image/png;base64,")
        )
        log_result("QR Code - Base64 Format", success)
    except Exception as e:
        log_result("QR Code - Base64", False, str(e))

def test_nfc_data():
    """Test 3.3: NFC Tag Data Generation"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/dpp/nfc-data/LST-001", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "NTAG" in str(data.get("data", {}).get("compatible_tag_types", []))
        )
        log_result("NFC Tag Data", success)
    except Exception as e:
        log_result("NFC Tag Data", False, str(e))

def test_package_label():
    """Test 3.4: Package Label Generation"""
    try:
        payload = {
            "listing_id": "LST-001",
            "product_name": "Bose QuietComfort Headphones",
            "condition_grade": "B",
            "price": 5999,
            "qr_size": 200
        }
        response = requests.post(f"{BASE_URL}/api/v1/dpp/package-label", json=payload, timeout=10)
        data = response.json()
        label = data.get("data", {}).get("label_base64", "")
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            label.startswith("data:image/png;base64,")
        )
        log_result("Package Label Generation", success)
    except Exception as e:
        log_result("Package Label", False, str(e))

# ============================================================================
# CATEGORY 4: BLOCKCHAIN DPP (4 endpoints)
# ============================================================================

def test_blockchain_record_event():
    """Test 4.1: Blockchain - Record Event"""
    try:
        payload = {
            "item_id": "GTIN-TEST-001",
            "event_type": "MANUFACTURED",
            "data": {
                "factory": "Factory A, Vietnam",
                "batch": "BATCH-2026-06-15"
            },
            "actor": "test-system"
        }
        response = requests.post(f"{BASE_URL}/api/v1/blockchain/record-event", json=payload, timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "block_hash" in data.get("data", {})
        )
        log_result("Blockchain - Record Event", success)
    except Exception as e:
        log_result("Blockchain - Record Event", False, str(e))

def test_blockchain_get_history():
    """Test 4.2: Blockchain - Get History"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/blockchain/history/GTIN-TEST-001", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "history" in data.get("data", {})
        )
        log_result("Blockchain - Get History", success)
    except Exception as e:
        log_result("Blockchain - Get History", False, str(e))

def test_blockchain_verify_integrity():
    """Test 4.3: Blockchain - Verify Integrity"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/blockchain/verify-integrity", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            data.get("data", {}).get("valid") == True
        )
        log_result("Blockchain - Verify Integrity", success)
    except Exception as e:
        log_result("Blockchain - Verify Integrity", False, str(e))

def test_blockchain_export():
    """Test 4.4: Blockchain - Export Chain"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/blockchain/export", timeout=10)
        data = response.json()
        chain_data = data.get("data", {}).get("chain", "")
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            len(chain_data) > 100  # Chain has data
        )
        log_result("Blockchain - Export Chain", success)
    except Exception as e:
        log_result("Blockchain - Export", False, str(e))

# ============================================================================
# CATEGORY 5: VIDEO VTO (3 endpoints) - Requires user image
# ============================================================================

def test_vto_multi_angle():
    """Test 5.1: VTO - Multi-Angle Static Images"""
    try:
        # Create a small test image (1x1 white pixel)
        test_image_b64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/VAAA="
        
        payload = {
            "user_image_base64": test_image_b64,
            "garment_sku": "hoodie-001",
            "angles": [0, 90, 180, 270]
        }
        response = requests.post(f"{BASE_URL}/api/vto/multi-angle", json=payload, timeout=30)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "images" in data.get("data", {})
        )
        log_result("VTO - Multi-Angle Static", success)
    except Exception as e:
        log_result("VTO - Multi-Angle", False, str(e))

# ============================================================================
# CATEGORY 6: FABRIC PHYSICS (1 endpoint)
# ============================================================================

def test_fabric_physics():
    """Test 6.1: Fabric Physics Simulation"""
    try:
        payload = {
            "fabric_type": "cotton",
            "body_measurements": {
                "chest_cm": 98,
                "waist_cm": 84
            },
            "garment_measurements": {
                "chest_cm": 100,
                "waist_cm": 86
            }
        }
        response = requests.post(f"{BASE_URL}/api/vto/fabric-physics", json=payload, timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "fit_feel" in data.get("data", {}) and
            "comfort_score" in data.get("data", {})
        )
        log_result("Fabric Physics Simulation", success)
    except Exception as e:
        log_result("Fabric Physics", False, str(e))

# ============================================================================
# CATEGORY 7: SERIAL VERIFICATION (2 endpoints)
# ============================================================================

def test_serial_verification():
    """Test 7.1: Serial Number Verification"""
    try:
        # Small test image
        test_image_b64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/VAAA="
        
        payload = {
            "order_id": "ORD-001",
            "image_b64": test_image_b64,
            "user_claimed_sn": ""
        }
        response = requests.post(f"{BASE_URL}/api/v1/vision/verify-serial", json=payload, timeout=15)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "verification" in data.get("data", {})
        )
        log_result("Serial Number Verification", success)
    except Exception as e:
        log_result("Serial Verification", False, str(e))

def test_serial_sample():
    """Test 7.2: Get Serial Sample"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/demo/serial-sample", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "expected_serial" in data.get("data", {})
        )
        log_result("Serial Sample Demo", success)
    except Exception as e:
        log_result("Serial Sample", False, str(e))

# ============================================================================
# CATEGORY 8: ENHANCED TRIAGE (1 endpoint)
# ============================================================================

def test_enhanced_triage():
    """Test 8.1: Enhanced Triage with Compliance"""
    try:
        payload = {
            "msrp": 7900,
            "grade": "B",
            "reason": "Minor cosmetic wear",
            "product_id": "Electronics Bose QC Headphones"
        }
        response = requests.post(f"{BASE_URL}/api/v1/ml/triage-enhanced", json=payload, timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "pathway" in data.get("data", {}) and
            "compliance" in data.get("data", {})
        )
        log_result("Enhanced Triage (with Compliance)", success)
    except Exception as e:
        log_result("Enhanced Triage", False, str(e))

# ============================================================================
# CATEGORY 9: UPDATED EXISTING ENDPOINTS (2 endpoints)
# ============================================================================

def test_dpp_with_blockchain():
    """Test 9.1: DPP Endpoint (Updated with Blockchain)"""
    try:
        response = requests.get(f"{BASE_URL}/dpp?listing_id=LST-001", timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            "blockchain" in data and
            "gs1" in data and
            data.get("gs1", {}).get("verification_source") is not None
        )
        log_result("DPP with Blockchain Integration", success)
    except Exception as e:
        log_result("DPP with Blockchain", False, str(e))

# ============================================================================
# CATEGORY 10: EXISTING CORE ENDPOINTS (Sanity Check)
# ============================================================================

def test_catalog():
    """Test 10.1: Get Catalog"""
    try:
        response = requests.get(f"{BASE_URL}/catalog", timeout=10)
        success = response.status_code == 200 and isinstance(response.json(), list)
        log_result("Catalog Endpoint", success)
    except Exception as e:
        log_result("Catalog", False, str(e))

def test_demand_rank():
    """Test 10.2: Demand Ranking"""
    try:
        payload = {
            "product_category": "electronics",
            "product_price": 5000,
            "user_geohash": "gcpvj"
        }
        response = requests.post(f"{BASE_URL}/api/v1/ml/demand/rank", json=payload, timeout=10)
        data = response.json()
        success = response.status_code == 200 and data.get("status") == "success"
        log_result("Demand Ranking", success)
    except Exception as e:
        log_result("Demand Ranking", False, str(e))

def test_condition_inspection():
    """Test 10.3: Condition Inspection (Gemini AI)"""
    try:
        payload = {
            "image_bytes_list": ["test_image_data"]
        }
        response = requests.post(f"{BASE_URL}/api/v1/ml/aws/inspect-condition", json=payload, timeout=15)
        data = response.json()
        success = response.status_code == 200 and data.get("status") == "success"
        log_result("AI Condition Inspection", success)
    except Exception as e:
        log_result("Condition Inspection", False, str(e))

def test_triage_basic():
    """Test 10.4: Basic Triage"""
    try:
        payload = {
            "msrp": 7900,
            "grade": "B",
            "reason": "Minor wear",
            "product_id": "Bose QC Headphones"
        }
        response = requests.post(f"{BASE_URL}/api/v1/ml/triage", json=payload, timeout=10)
        data = response.json()
        success = (
            response.status_code == 200 and
            data.get("status") == "success" and
            "pathway" in data.get("data", {})
        )
        log_result("Basic Triage (Existing)", success)
    except Exception as e:
        log_result("Basic Triage", False, str(e))

# ============================================================================
# RUN ALL TESTS
# ============================================================================

def run_all_tests():
    """Run all test functions"""
    print("\n" + "="*80)
    print("🚀 SecondLife Commerce - Comprehensive API Testing")
    print("="*80 + "\n")
    
    print("⏳ Testing server availability...")
    test_health_check()
    
    if test_results["failed"] > 0:
        print("\n❌ Server is not running! Start server with:")
        print("   cd backend/ml-service")
        print("   uvicorn main:app --reload --port 8000")
        return
    
    print("\n" + "-"*80)
    print("📋 CATEGORY 1: REGULATORY COMPLIANCE")
    print("-"*80)
    test_compliance_electronics()
    test_compliance_cosmetics()
    test_compliance_lithium_battery()
    test_compliance_category_info()
    test_cpsc_recall_check()
    
    print("\n" + "-"*80)
    print("🔍 CATEGORY 2: GS1 VERIFICATION (REAL, NOT MOCKED)")
    print("-"*80)
    test_gs1_verify_valid_gtin()
    test_gs1_verify_invalid_gtin()
    test_gs1_batch_verify()
    test_gs1_certificate()
    
    print("\n" + "-"*80)
    print("📱 CATEGORY 3: QR CODE & NFC GENERATION")
    print("-"*80)
    test_qr_code_png()
    test_qr_code_base64()
    test_nfc_data()
    test_package_label()
    
    print("\n" + "-"*80)
    print("⛓️  CATEGORY 4: BLOCKCHAIN DPP (IMMUTABLE)")
    print("-"*80)
    test_blockchain_record_event()
    time.sleep(0.5)  # Small delay between blockchain ops
    test_blockchain_get_history()
    test_blockchain_verify_integrity()
    test_blockchain_export()
    
    print("\n" + "-"*80)
    print("👕 CATEGORY 5: VIDEO VTO")
    print("-"*80)
    test_vto_multi_angle()
    
    print("\n" + "-"*80)
    print("🧵 CATEGORY 6: FABRIC PHYSICS")
    print("-"*80)
    test_fabric_physics()
    
    print("\n" + "-"*80)
    print("🔢 CATEGORY 7: SERIAL VERIFICATION")
    print("-"*80)
    test_serial_verification()
    test_serial_sample()
    
    print("\n" + "-"*80)
    print("🎯 CATEGORY 8: ENHANCED TRIAGE")
    print("-"*80)
    test_enhanced_triage()
    
    print("\n" + "-"*80)
    print("🔄 CATEGORY 9: UPDATED EXISTING ENDPOINTS")
    print("-"*80)
    test_dpp_with_blockchain()
    
    print("\n" + "-"*80)
    print("✅ CATEGORY 10: EXISTING CORE ENDPOINTS (Sanity Check)")
    print("-"*80)
    test_catalog()
    test_demand_rank()
    test_condition_inspection()
    test_triage_basic()
    
    # Final summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    total = test_results["passed"] + test_results["failed"]
    print(f"✅ PASSED: {test_results['passed']}/{total}")
    print(f"❌ FAILED: {test_results['failed']}/{total}")
    
    if test_results["failed"] > 0:
        print("\n❌ FAILED TESTS:")
        for error in test_results["errors"]:
            print(f"   • {error}")
        print("\n🔧 Fix these issues before demo!")
    else:
        print("\n🎉 ALL TESTS PASSED! Ready for demo! 🚀")
    
    print("="*80 + "\n")
    
    return test_results["failed"] == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
