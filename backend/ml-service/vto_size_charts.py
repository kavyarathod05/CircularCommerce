"""Per-product size charts for VTO fit scoring."""
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class SizeChart:
    size: str
    shoulder_cm: float
    chest_cm: float
    length_cm: float


@dataclass
class BodyMeasurements:
    shoulder_cm: float
    chest_cm: float
    height_cm: float


# Keys matched via substring on product_id (lowercase)
PRODUCT_CHARTS: Dict[str, Dict[str, SizeChart]] = {
    "hoodie": {
        "S": SizeChart("S", 42.0, 92.0, 64.0),
        "M": SizeChart("M", 44.0, 98.0, 67.0),
        "L": SizeChart("L", 46.0, 104.0, 70.0),
        "XL": SizeChart("XL", 48.0, 110.0, 72.0),
    },
    "shirt": {
        "S": SizeChart("S", 41.0, 90.0, 68.0),
        "M": SizeChart("M", 43.0, 96.0, 71.0),
        "L": SizeChart("L", 45.0, 102.0, 74.0),
    },
    "jacket": {
        "M": SizeChart("M", 45.0, 100.0, 69.0),
        "L": SizeChart("L", 47.0, 106.0, 72.0),
    },
    "jeans": {
        "30": SizeChart("30", 42.0, 88.0, 102.0),
        "32": SizeChart("32", 44.0, 94.0, 104.0),
        "34": SizeChart("34", 46.0, 100.0, 106.0),
    },
}

WEARABLE_DEFAULT = SizeChart("ONE", 44.0, 96.0, 67.0)


def resolve_chart(product_id: str, target_size: str = "M") -> Optional[SizeChart]:
    key = (product_id or "").lower()
    for category, charts in PRODUCT_CHARTS.items():
        if category in key:
            size_key = target_size.upper() if target_size.upper() in charts else "M"
            if size_key in charts:
                return charts[size_key]
            return next(iter(charts.values()))
    if any(k in key for k in ("headphone", "bose", "iphone", "phone")):
        return WEARABLE_DEFAULT
    return PRODUCT_CHARTS["hoodie"].get("M")


def calculate_fit_score(body: BodyMeasurements, chart: SizeChart):
    shoulder_diff = abs(body.shoulder_cm - chart.shoulder_cm) / max(chart.shoulder_cm, 1)
    chest_diff = abs(body.chest_cm - chart.chest_cm) / max(chart.chest_cm, 1)
    avg_diff = shoulder_diff * 0.5 + chest_diff * 0.5
    match_pct = max(0.0, min(100.0, (1 - avg_diff) * 100))
    return_prob = min(35.0, avg_diff * 30)
    stress = "general fit"
    if shoulder_diff > 0.1:
        stress = "tight at shoulders" if body.shoulder_cm > chart.shoulder_cm else "loose at shoulders"
    elif chest_diff > 0.1:
        stress = "tight at chest" if body.chest_cm > chart.chest_cm else "loose at chest"
    return match_pct, stress, return_prob
