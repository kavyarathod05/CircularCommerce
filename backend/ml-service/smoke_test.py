"""Quick smoke test for demo-critical API endpoints."""
import io
import json
import os
import sys
import time

import requests
from dotenv import load_dotenv
from PIL import Image, ImageDraw

load_dotenv()
BASE = os.getenv("ML_API_BASE", "http://127.0.0.1:8000")
TIMEOUT = 120


def ok(label, cond, detail=""):
    status = "PASS" if cond else "FAIL"
    print(f"[{status}] {label}" + (f" — {detail}" if detail else ""))
    return 1 if cond else 0


def make_person_jpeg() -> bytes:
    img = Image.new("RGB", (480, 640), (210, 195, 180))
    d = ImageDraw.Draw(img)
    d.ellipse([170, 80, 310, 220], fill=(180, 140, 110))
    d.rectangle([140, 220, 340, 520], fill=(90, 120, 160))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def main():
    passed = 0
    total = 0

    # Health
    total += 1
    try:
        r = requests.get(f"{BASE}/health", timeout=10)
        passed += ok("Health", r.status_code == 200 and bool(r.json().get("status")), r.text[:80])
    except Exception as e:
        ok("Health", False, str(e))

    # Catalog
    total += 1
    try:
        r = requests.get(f"{BASE}/catalog", timeout=15)
        data = r.json()
        passed += ok("Catalog", r.status_code == 200 and len(data) >= 3, f"{len(data)} items")
    except Exception as e:
        ok("Catalog", False, str(e))

    # Static assets
    for path in ["/static/demo-receipt.svg", "/static/demo-package-label.svg"]:
        total += 1
        try:
            r = requests.get(f"{BASE}{path}", timeout=10)
            passed += ok(f"Static {path}", r.status_code == 200, f"{len(r.content)} bytes")
        except Exception as e:
            ok(f"Static {path}", False, str(e))

    # Product VTO info
    total += 1
    try:
        r = requests.get(f"{BASE}/api/products/Essentials%20Cotton%20Hoodie", timeout=10)
        j = r.json()
        passed += ok("Product VTO info", j.get("status") == "success" and bool(j.get("data", {}).get("size_chart")), "")
    except Exception as e:
        ok("Product VTO info", False, str(e))

    # VTO generate — hoodie (apparel)
    total += 1
    print("\n--- VTO generate (hoodie, may take up to 90s for IDM-VTON cold start) ---")
    try:
        t0 = time.time()
        files = {"photo": ("person.jpg", make_person_jpeg(), "image/jpeg")}
        data = {"product_id": "Essentials Cotton Hoodie", "height_cm": "170", "target_size": "M"}
        r = requests.post(f"{BASE}/api/vto/generate", files=files, data=data, timeout=TIMEOUT)
        elapsed = round(time.time() - t0, 1)
        j = r.json()
        if r.status_code != 200:
            passed += ok("VTO generate (hoodie)", False, f"HTTP {r.status_code} {j}")
        else:
            d = j.get("data", {})
            has_img = bool(d.get("tryon_image_url") or d.get("draped_image_url"))
            model = d.get("model_used", "?")
            match = d.get("size_match_pct", "?")
            passed += ok(
                "VTO generate (hoodie)",
                j.get("status") == "success" and has_img,
                f"{elapsed}s model={model} fit={match}%",
            )
    except Exception as e:
        ok("VTO generate (hoodie)", False, str(e))

    # VTO generate — headphones (wearable overlay)
    total += 1
    try:
        files = {"photo": ("person.jpg", make_person_jpeg(), "image/jpeg")}
        data = {"product_id": "Bose QC Headphones", "height_cm": "170", "target_size": "M"}
        r = requests.post(f"{BASE}/api/vto/generate", files=files, data=data, timeout=60)
        j = r.json()
        d = j.get("data", {})
        passed += ok(
            "VTO generate (headphones)",
            j.get("status") == "success" and d.get("tryon_image_url"),
            f"model={d.get('model_used')}",
        )
    except Exception as e:
        ok("VTO generate (headphones)", False, str(e))

    # Fraud graphrag + receipt
    total += 1
    try:
        r = requests.post(
            f"{BASE}/api/v1/ml/fraud-graphrag",
            json={"user_id": "usr-12", "receipt_image_base64": "demo"},
            timeout=15,
        )
        j = r.json()
        url = j.get("data", {}).get("receipt_image_url", "")
        passed += ok("Fraud graphrag", j.get("status") == "success" and url, url)
    except Exception as e:
        ok("Fraud graphrag", False, str(e))

    # Serial verify
    total += 1
    try:
        sample = requests.get(f"{BASE}/api/v1/demo/serial-sample", timeout=10).json()
        label_url = sample["data"]["sample_image_url"]
        if not label_url.startswith("http"):
            label_url = BASE + label_url
        img_bytes = requests.get(label_url, timeout=10).content
        import base64
        b64 = base64.b64encode(img_bytes).decode()
        r = requests.post(
            f"{BASE}/api/v1/vision/verify-serial",
            json={"order_id": "ORD-001", "image_b64": f"data:image/svg+xml;base64,{b64}"},
            timeout=20,
        )
        j = r.json()
        passed += ok(
            "Serial verification",
            j.get("status") == "success" and j.get("data", {}).get("verification", {}).get("is_match") is not None,
            j.get("data", {}).get("verification", {}).get("fraud_risk_level"),
        )
    except Exception as e:
        ok("Serial verification", False, str(e))

    # Friction
    total += 1
    try:
        r = requests.post(
            f"{BASE}/api/v1/ml/friction/evaluate",
            json={
                "user_id": "usr-12",
                "product_id": "p-hoodie",
                "session_data": {
                    "cart_items": [{"name": "Hoodie", "size": "M"}, {"name": "Hoodie", "size": "L"}],
                    "return_velocity": 1,
                    "dwell_time_seconds": 90,
                },
            },
            timeout=15,
        )
        j = r.json()
        d = j.get("data", {})
        passed += ok(
            "Friction evaluate",
            d.get("returnRiskPercent") is not None and d.get("fitConfidencePercent") is not None,
            f"risk={d.get('returnRiskPercent')}% fit={d.get('fitConfidencePercent')}%",
        )
    except Exception as e:
        ok("Friction evaluate", False, str(e))

    print(f"\n=== {passed}/{total} checks passed ===")
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
