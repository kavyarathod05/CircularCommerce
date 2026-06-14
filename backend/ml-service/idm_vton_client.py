"""IDM-VTON via Hugging Face Space (Gradio API) with local fallback."""
import base64
import io
import json
import os
import time
import requests
from typing import Optional, Tuple
from PIL import Image

SPACE_URL = os.getenv("IDM_VTON_SPACE_URL", "https://yisol-idm-vton.hf.space")
SPACE_API = os.getenv("IDM_VTON_API_NAME", "tryon")


def _hf_headers():
    headers = {"Content-Type": "application/json"}
    token = os.getenv("HF_TOKEN") or os.getenv("HF_API_KEY")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _to_data_uri(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def _parse_sse_result(text: str) -> Optional[str]:
    for line in text.splitlines():
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if payload == "[DONE]":
            continue
        try:
            data = json.loads(payload)
            if isinstance(data, list) and data:
                last = data[-1]
                if isinstance(last, str) and (last.startswith("http") or last.startswith("data:")):
                    return last
                if isinstance(last, dict) and last.get("url"):
                    return last["url"]
        except json.JSONDecodeError:
            continue
    return None


def call_idm_vton_gradio_client(
    person_bytes: bytes, garment_bytes: bytes, description: str = "upper body garment"
) -> Optional[bytes]:
    """Use gradio_client when installed (Option B)."""
    try:
        from gradio_client import Client, handle_file
        import tempfile

        token = os.getenv("HF_TOKEN") or os.getenv("HF_API_KEY")
        client = Client("yisol/IDM-VTON", token=token)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as p:
            p.write(person_bytes)
            person_path = p.name
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as g:
            g.write(garment_bytes)
            garment_path = g.name
        result = client.predict(
            handle_file(person_path),
            handle_file(garment_path),
            description,
            True,
            False,
            int(os.getenv("IDM_VTON_STEPS", "30")),
            int(os.getenv("IDM_VTON_SEED", "42")),
            api_name=f"/{SPACE_API}",
        )
        if isinstance(result, str) and result.startswith("http"):
            return requests.get(result, timeout=60).content
        if isinstance(result, str) and os.path.isfile(result):
            with open(result, "rb") as f:
                return f.read()
    except Exception as e:
        print(f"[IDM-VTON] gradio_client failed: {e}")
    return None


def call_idm_vton_http(
    person_bytes: bytes, garment_bytes: bytes, description: str = "upper body garment"
) -> Optional[bytes]:
    """Option A: raw Gradio HTTP /call + SSE poll."""
    person_uri = _to_data_uri(person_bytes)
    garment_uri = _to_data_uri(garment_bytes)
    payload = {
        "data": [
            person_uri,
            garment_uri,
            description,
            True,
            False,
            int(os.getenv("IDM_VTON_STEPS", "30")),
            int(os.getenv("IDM_VTON_SEED", "42")),
        ]
    }
    try:
        r = requests.post(
            f"{SPACE_URL}/call/{SPACE_API}",
            headers=_hf_headers(),
            json=payload,
            timeout=30,
        )
        r.raise_for_status()
        event_id = r.json().get("event_id")
        if not event_id:
            return None
        for _ in range(int(os.getenv("IDM_VTON_POLL_MAX", "25"))):
            sr = requests.get(
                f"{SPACE_URL}/call/{SPACE_API}/{event_id}",
                headers=_hf_headers(),
                timeout=15,
            )
            if sr.status_code != 200:
                time.sleep(2)
                continue
            url = _parse_sse_result(sr.text)
            if url:
                if url.startswith("data:"):
                    b64 = url.split(",", 1)[1]
                    return base64.b64decode(b64)
                resp = requests.get(url, timeout=60)
                if resp.status_code == 200:
                    return resp.content
                return None
            time.sleep(2)
    except Exception as e:
        print(f"[IDM-VTON] HTTP API failed: {e}")
    return None


def try_idm_vton(person_bytes: bytes, garment_bytes: bytes, description: str) -> Tuple[Optional[bytes], str]:
    """Try gradio_client first, optional HTTP fallback; return (image_bytes, model_label)."""
    out = call_idm_vton_gradio_client(person_bytes, garment_bytes, description)
    if out:
        return out, "idm-vton-gradio-client"
    if os.getenv("IDM_VTON_HTTP_FALLBACK", "0") == "1":
        out = call_idm_vton_http(person_bytes, garment_bytes, description)
        if out:
            return out, "idm-vton-hf-space"
    return None, "unavailable"
