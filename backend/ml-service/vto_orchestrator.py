"""VTO orchestrator: pose → fit score → IDM-VTON (or local overlay) → cached response."""
import base64
import hashlib
import io
import os
import time
import requests
from typing import Any, Dict, Optional
from PIL import Image

from product_registry import lookup_product
from vto_pose import estimate_body_measurements
from vto_size_charts import calculate_fit_score, resolve_chart
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from idm_vton_client import try_idm_vton
from vto_engine import VirtualTryOnEngine
from kolors_vto_local import get_kolors_vto_engine

_cache: Dict[str, Dict[str, Any]] = {}
_vto_engine = VirtualTryOnEngine()
_kolors_engine = None  # Lazy load on first use


def _try_idm_with_timeout(person_bytes: bytes, garment_bytes: bytes, description: str):
    timeout = int(os.getenv("IDM_VTON_TIMEOUT_SEC", "12"))
    with ThreadPoolExecutor(max_workers=1) as pool:
        fut = pool.submit(try_idm_vton, person_bytes, garment_bytes, description)
        try:
            return fut.result(timeout=timeout)
        except FuturesTimeout:
            print(f"[VTO] IDM-VTON timed out after {timeout}s — using local overlay")
            return None, "idm-vton-timeout"
        except Exception as e:
            print(f"[VTO] IDM-VTON error: {e}")
            return None, "idm-vton-error"


def _cache_key(photo_bytes: bytes, product_id: str, height_cm: float, target_size: str) -> str:
    h = hashlib.md5(photo_bytes).hexdigest()
    return f"{h}:{product_id}:{height_cm}:{target_size}:v2"


def _is_apparel(product_id: str) -> bool:
    k = product_id.lower()
    return any(x in k for x in ("hoodie", "shirt", "jacket", "jeans", "cotton", "apparel"))


def _download_garment(url: str) -> bytes:
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    return r.content


def _bytes_to_data_uri(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def _save_public_result(image_bytes: bytes) -> str:
    os.makedirs("vto-storage", exist_ok=True)
    name = f"vto-storage/result_{int(time.time())}.jpg"
    Image.open(io.BytesIO(image_bytes)).convert("RGB").save(name, format="JPEG", quality=90)
    return f"/vto-storage/{os.path.basename(name)}"


class VTOOrchestrator:
    def get_product(self, product_id: str) -> Dict[str, Any]:
        reg = lookup_product(product_id)
        chart = resolve_chart(product_id, "M")
        meta = _vto_engine._resolve_product(product_id)
        return {
            "product_id": product_id,
            "name": reg.get("product_name", product_id),
            "category": meta.get("category", "apparel"),
            "image": reg.get("image") or meta.get("url", ""),
            "size_chart": {
                "default_size": chart.size if chart else "M",
                "shoulder_cm": chart.shoulder_cm if chart else 44,
                "chest_cm": chart.chest_cm if chart else 98,
                "length_cm": chart.length_cm if chart else 67,
            },
        }

    def generate(
        self,
        photo_bytes: bytes,
        product_id: str,
        height_cm: float = 170.0,
        target_size: str = "M",
    ) -> Dict[str, Any]:
        ck = _cache_key(photo_bytes, product_id, height_cm, target_size)
        if ck in _cache:
            cached = dict(_cache[ck])
            cached["cached"] = True
            return cached

        body = estimate_body_measurements(photo_bytes, height_cm)
        chart = resolve_chart(product_id, target_size)
        match_pct, stress, return_prob = calculate_fit_score(body, chart)

        reg = lookup_product(product_id)
        meta = _vto_engine._resolve_product(product_id)
        garment_url = reg.get("image") or meta["url"]
        garment_bytes = _download_garment(garment_url)

        result_bytes: Optional[bytes] = None
        model_used = "local-bg-removal-overlay"

        # Try Kolors VTO first (best quality)
        use_kolors = os.getenv("VTO_USE_KOLORS", "1") == "1" and _is_apparel(product_id)
        if use_kolors:
            global _kolors_engine
            if _kolors_engine is None:
                _kolors_engine = get_kolors_vto_engine()
            try:
                result_bytes, kolors_label = _kolors_engine.generate_from_bytes(photo_bytes, garment_bytes)
                if result_bytes:
                    model_used = kolors_label
            except Exception as e:
                print(f"[VTO] Kolors failed: {e}, falling back to IDM-VTON")

        # Fallback to IDM-VTON if Kolors didn't work
        if result_bytes is None:
            use_idm = os.getenv("VTO_USE_IDM", "0") == "1" and _is_apparel(product_id)
            if use_idm:
                desc = reg.get("product_name", "garment") or "upper body garment"
                result_bytes, idm_label = _try_idm_with_timeout(photo_bytes, garment_bytes, desc)
                if result_bytes:
                    model_used = idm_label

        if result_bytes is None:
            b64_in = base64.b64encode(photo_bytes).decode("utf-8")
            local = _vto_engine.process_vto_draping(
                f"data:image/jpeg;base64,{b64_in}",
                product_id,
                user_measurements={"shoulder_cm": body.shoulder_cm, "chest_cm": body.chest_cm},
            )
            if local.get("status") == "FAILED":
                raise ValueError(local.get("error", "VTO failed"))
            draped = local.get("draped_image_url", "")
            if draped.startswith("data:"):
                result_bytes = base64.b64decode(draped.split(",", 1)[1])
            model_used = local.get("model_used", model_used)

        public_path = _save_public_result(result_bytes)
        tryon_url = _bytes_to_data_uri(result_bytes)

        response = {
            "tryon_image_url": tryon_url,
            "tryon_image_path": public_path,
            "size_match_pct": round(match_pct, 1),
            "stress_points": stress,
            "return_probability": round(return_prob, 1),
            "recommended_size": chart.size if chart else target_size,
            "body_measurements": {
                "shoulder_cm": body.shoulder_cm,
                "chest_cm": body.chest_cm,
                "height_cm": body.height_cm,
            },
            "model_used": model_used,
            "cached": False,
            # backward compat for existing frontend
            "draped_image_url": tryon_url,
            "fit_analysis": {
                "size_match_confidence": match_pct / 100.0,
                "predicted_stress_points": [stress],
                "return_probability_reduction": f"{return_prob:.0f}% estimated return risk for this size",
            },
        }
        _cache[ck] = response
        return response
