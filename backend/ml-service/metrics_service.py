"""
Seller and platform sustainability metrics computed from DynamoDB.
Falls back to user store aggregates when AWS tables are unavailable.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

CO2_PER_WAREHOUSE_RETURN_KG = 2.4
CO2_PER_HYPERLOCAL_MATCH_KG = 0.35
TREES_PER_KG_CO2 = 1 / 21.2


def _scan_table(table_name: str, region: str) -> List[Dict[str, Any]]:
    try:
        table = boto3.resource("dynamodb", region_name=region).Table(table_name)
        items: List[Dict[str, Any]] = []
        response = table.scan()
        items.extend(response.get("Items", []))
        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
        return items
    except (BotoCoreError, ClientError, Exception):
        return []


def _float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def get_seller_metrics(seller_id: str, user_store: Optional[Dict[str, Dict]] = None) -> Dict[str, Any]:
    region = os.getenv("AWS_REGION", "us-east-1")
    listings = _scan_table("SecondLife_Listings", region) or _scan_table("ListingsTable", region)
    returns = _scan_table("ReturnsTable", region)
    carbon_rows = _scan_table("CarbonMetrics", region)

    seller_listings = [
        item for item in listings
        if str(item.get("owner", "")).find(seller_id) >= 0
        or str(item.get("sellerId", "")) == seller_id
    ]
    seller_returns = [r for r in returns if str(r.get("SellerId", r.get("sellerId", ""))) == seller_id]
    seller_carbon = [c for c in carbon_rows if str(c.get("sellerId", c.get("SellerId", ""))) == seller_id]

    hyperlocal = sum(1 for r in seller_returns if r.get("pathway") in ("hyperlocal-p2p", "locker-dropoff"))
    warehouse = sum(1 for r in seller_returns if r.get("pathway") in ("warehouse", "centralized"))
    total_returns = max(len(seller_returns), 1)

    co2_saved = sum(_float(c.get("co2_saved_kg", c.get("Co2SavedKg"))) for c in seller_carbon)
    if co2_saved == 0 and seller_returns:
        co2_saved = hyperlocal * CO2_PER_HYPERLOCAL_MATCH_KG + warehouse * 0.2

    if co2_saved == 0 and user_store:
        for user in user_store.values():
            if user.get("id") == seller_id:
                co2_saved = _float(user.get("co2_saved_kg"), 0.0)
                break

    escrow_locked = sum(
        _float(item.get("price", item.get("msrp")))
        for item in seller_listings
        if str(item.get("escrowStatus", "")).lower().startswith("lock")
    )
    capital_recovery = sum(
        _float(item.get("price", item.get("msrp")))
        for item in seller_listings
        if str(item.get("status", "")).lower() == "sold"
    )

    warehouse_avoidance = round((hyperlocal / total_returns) * 100, 1) if seller_returns else 0.0

    return {
        "warehouse_avoidance_rate": warehouse_avoidance,
        "co2_saved_kg": round(co2_saved, 2),
        "trees_planted": round(co2_saved * TREES_PER_KG_CO2, 2),
        "capital_recovery_value": round(capital_recovery, 2),
        "escrow_locked_funds": round(escrow_locked, 2),
        "listings_active": sum(1 for i in seller_listings if str(i.get("status", "")).lower() == "available"),
        "returns_intercepted": hyperlocal,
        "data_source": "dynamodb" if listings or returns or carbon_rows else "computed",
    }
