"""Unit tests for seller metrics computation."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend', 'ml-service'))

from metrics_service import get_seller_metrics, CO2_PER_HYPERLOCAL_MATCH_KG


def test_seller_metrics_empty_store():
    result = get_seller_metrics("usr-unknown", {})
    assert "co2_saved_kg" in result
    assert "warehouse_avoidance_rate" in result
    assert result["data_source"] in ("dynamodb", "computed")


def test_seller_metrics_from_user_store():
    store = {
        "a@x.com": {"id": "usr-abc", "co2_saved_kg": 42.0}
    }
    result = get_seller_metrics("usr-abc", store)
    assert result["co2_saved_kg"] == 42.0


def test_co2_constants():
    assert CO2_PER_HYPERLOCAL_MATCH_KG < 1.0
