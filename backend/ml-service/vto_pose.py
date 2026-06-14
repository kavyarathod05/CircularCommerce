"""Estimate body measurements from a user photo + declared height."""
import io
from PIL import Image
from vto_size_charts import BodyMeasurements


def estimate_body_measurements(image_bytes: bytes, height_cm: float = 170.0) -> BodyMeasurements:
    """
    Heuristic pose/body estimation without heavy ML deps.
    Uses image proportions + user height for pixel-to-cm calibration.
    Optional MediaPipe when installed.
    """
    try:
        import mediapipe as mp  # optional: pip install mediapipe
        return _estimate_mediapipe(image_bytes, height_cm, mp)
    except Exception:
        pass
    return _estimate_heuristic(image_bytes, height_cm)


def _estimate_heuristic(image_bytes: bytes, height_cm: float) -> BodyMeasurements:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    # Front-facing upper-body or full-body: shoulders ~26% of frame width
    shoulder_px = w * 0.26
    # Assume visible body span ~78% of image height maps to ~85% of stature
    px_per_cm = max((h * 0.78) / (height_cm * 0.85), 1.0)
    shoulder_cm = shoulder_px / px_per_cm
    chest_cm = shoulder_cm * 1.18
    return BodyMeasurements(
        shoulder_cm=round(shoulder_cm, 1),
        chest_cm=round(chest_cm, 1),
        height_cm=height_cm,
    )


def _estimate_mediapipe(image_bytes: bytes, height_cm: float, mp) -> BodyMeasurements:
    import numpy as np
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(img)
    h, w = arr.shape[:2]
    with mp.solutions.pose.Pose(static_image_mode=True) as pose:
        results = pose.process(arr)
        if not results.pose_landmarks:
            return _estimate_heuristic(image_bytes, height_cm)
        lm = results.pose_landmarks.landmark
        ls = lm[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
        rs = lm[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
        nose = lm[mp.solutions.pose.PoseLandmark.NOSE]
        ankle = lm[mp.solutions.pose.PoseLandmark.LEFT_ANKLE]
        shoulder_px = abs(ls.x - rs.x) * w
        body_px = abs(ankle.y - nose.y) * h
        px_per_cm = max(body_px / (height_cm * 0.92), 1.0)
        shoulder_cm = shoulder_px / px_per_cm
        chest_cm = shoulder_cm * 1.16
        return BodyMeasurements(
            shoulder_cm=round(shoulder_cm, 1),
            chest_cm=round(chest_cm, 1),
            height_cm=height_cm,
        )
