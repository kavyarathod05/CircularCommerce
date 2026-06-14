"""
SecondLife Commerce — Real-Time Logistics Telemetry Engine
==========================================================
Generates live fleet/order telemetry data for the SocketCluster-style
WebSocket layer.  Data streams include:
  • fleet:position   – GPS pings for every active vehicle
  • order:status     – lifecycle transitions (picked-up → in-transit → delivered)
  • fleet:metrics    – aggregate KPIs (utilization, ETA accuracy, carbon)
  • alert:dispatch   – anomaly / SLA-breach alerts
"""

import asyncio
import random
import math
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any

# ---------------------------------------------------------------------------
# City hub coordinates (lat, lng) – Bangalore metro area
# ---------------------------------------------------------------------------
CITY_HUBS = {
    "hub-koramangala":   (12.9352, 77.6245),
    "hub-indiranagar":   (12.9784, 77.6408),
    "hub-whitefield":    (12.9698, 77.7500),
    "hub-electronic-city": (12.8451, 77.6602),
    "hub-jayanagar":     (12.9250, 77.5938),
    "hub-hsr-layout":    (12.9116, 77.6389),
    "hub-marathahalli":  (12.9591, 77.6974),
    "hub-btm-layout":    (12.9166, 77.6101),
}

VEHICLE_TYPES = ["bike", "van", "truck", "ev-pod"]
ORDER_STATUSES = ["pending", "picked-up", "in-transit", "out-for-delivery", "delivered", "returned"]
ALERT_TYPES = [
    {"type": "sla_breach", "severity": "high", "message": "SLA breach: Order {order_id} exceeded delivery window by 12 min"},
    {"type": "route_deviation", "severity": "medium", "message": "Route deviation detected for vehicle {vehicle_id} near Silk Board Junction"},
    {"type": "temperature_alert", "severity": "low", "message": "Cold-chain temp spike on vehicle {vehicle_id}: 8.2°C → 12.1°C"},
    {"type": "congestion", "severity": "medium", "message": "Heavy traffic detected on Outer Ring Road — rerouting 3 vehicles"},
    {"type": "battery_low", "severity": "high", "message": "EV Pod {vehicle_id} battery at 12% — nearest charging hub: 1.4 km"},
]

PRODUCT_NAMES = [
    "Bose QC Headphones", "iPhone 14 Pro Max", "Essentials Cotton T-Shirt",
    "Samsung Galaxy Watch", "JBL Bluetooth Speaker", "Nike Air Max",
    "Sony WH-1000XM5", "Apple iPad Mini", "Kindle Paperwhite",
]


class LogisticsTelemetryEngine:
    """Generates realistic simulated telemetry for a fleet of delivery vehicles
    and their associated orders.  Designed to be polled or streamed via WebSocket."""

    def __init__(self, fleet_size: int = 12, active_orders: int = 24):
        self.fleet: List[Dict[str, Any]] = []
        self.orders: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []
        self._tick = 0
        self._init_fleet(fleet_size)
        self._init_orders(active_orders)

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------
    def _init_fleet(self, count: int):
        hub_keys = list(CITY_HUBS.keys())
        for i in range(count):
            hub = random.choice(hub_keys)
            base_lat, base_lng = CITY_HUBS[hub]
            self.fleet.append({
                "vehicleId": f"VH-{1000 + i}",
                "type": random.choice(VEHICLE_TYPES),
                "status": random.choice(["idle", "en-route", "returning", "en-route", "en-route"]),
                "driverId": f"DRV-{random.randint(100, 999)}",
                "driverName": random.choice(["Rahul K.", "Priya S.", "Amit T.", "Neha G.", "Vikram R.", "Sunita M.", "Raj P.", "Divya N.", "Karan B.", "Meera J.", "Arjun D.", "Pooja L."]),
                "hub": hub,
                "lat": base_lat + random.uniform(-0.03, 0.03),
                "lng": base_lng + random.uniform(-0.03, 0.03),
                "heading": random.uniform(0, 360),
                "speed_kmh": random.uniform(0, 45),
                "fuel_pct": random.uniform(40, 100),
                "capacity_used": random.randint(0, 8),
                "capacity_total": random.choice([4, 8, 16, 2]),
                "ordersCarrying": random.randint(0, 4),
                "currentOrderId": None,
                "eta_minutes": random.randint(5, 55),
                "last_ping": datetime.utcnow().isoformat() + "Z",
            })

    def _init_orders(self, count: int):
        statuses_weighted = ["in-transit"] * 6 + ["out-for-delivery"] * 4 + ["picked-up"] * 3 + ["pending"] * 2 + ["delivered"] * 3
        for i in range(count):
            origin_hub = random.choice(list(CITY_HUBS.keys()))
            dest_hub = random.choice([h for h in CITY_HUBS.keys() if h != origin_hub])
            o_lat, o_lng = CITY_HUBS[origin_hub]
            d_lat, d_lng = CITY_HUBS[dest_hub]
            status = random.choice(statuses_weighted)
            progress = {"pending": 0, "picked-up": 15, "in-transit": random.randint(30, 75), "out-for-delivery": random.randint(80, 95), "delivered": 100, "returned": 100}
            self.orders.append({
                "orderId": f"ORD-{uuid.uuid4().hex[:8].upper()}",
                "productName": random.choice(PRODUCT_NAMES),
                "status": status,
                "progress": progress.get(status, 50),
                "originHub": origin_hub,
                "destinationHub": dest_hub,
                "originLat": o_lat,
                "originLng": o_lng,
                "destLat": d_lat + random.uniform(-0.01, 0.01),
                "destLng": d_lng + random.uniform(-0.01, 0.01),
                "vehicleId": random.choice(self.fleet)["vehicleId"] if status in ["in-transit", "out-for-delivery"] else None,
                "eta_minutes": random.randint(8, 90) if status not in ["delivered", "pending"] else 0,
                "customerName": random.choice(["Aarav M.", "Diya S.", "Ishaan K.", "Ananya R.", "Rohan P.", "Kavya T.", "Arjun D.", "Saanvi N."]),
                "pathway": random.choice(["hyperlocal-p2p", "locker-dropoff", "premium", "refurbish"]),
                "carbonSaved_kg": round(random.uniform(2, 60), 1),
                "createdAt": (datetime.utcnow() - timedelta(minutes=random.randint(5, 300))).isoformat() + "Z",
                "updatedAt": datetime.utcnow().isoformat() + "Z",
            })

    # ------------------------------------------------------------------
    # Tick — advance simulation by one step (~2 seconds real-time)
    # ------------------------------------------------------------------
    def tick(self) -> Dict[str, Any]:
        """Returns a dict of all events generated in this simulation tick."""
        self._tick += 1
        events: Dict[str, Any] = {
            "fleet_positions": [],
            "order_updates": [],
            "alerts": [],
            "metrics": {},
        }

        # 1. Move vehicles
        for v in self.fleet:
            if v["status"] == "en-route":
                # Simulate movement
                v["lat"] += random.uniform(-0.002, 0.002)
                v["lng"] += random.uniform(-0.002, 0.002)
                v["heading"] = (v["heading"] + random.uniform(-15, 15)) % 360
                v["speed_kmh"] = max(0, min(60, v["speed_kmh"] + random.uniform(-5, 5)))
                v["fuel_pct"] = max(5, v["fuel_pct"] - random.uniform(0.05, 0.3))
                if v["eta_minutes"] > 0:
                    v["eta_minutes"] = max(0, v["eta_minutes"] - random.uniform(0.5, 2))
            elif v["status"] == "returning":
                hub_lat, hub_lng = CITY_HUBS[v["hub"]]
                v["lat"] += (hub_lat - v["lat"]) * 0.08
                v["lng"] += (hub_lng - v["lng"]) * 0.08
                v["speed_kmh"] = max(0, v["speed_kmh"] - 1)
                if abs(v["lat"] - hub_lat) < 0.001 and abs(v["lng"] - hub_lng) < 0.001:
                    v["status"] = "idle"
            elif v["status"] == "idle" and random.random() < 0.05:
                v["status"] = "en-route"
                v["speed_kmh"] = random.uniform(15, 35)
                v["eta_minutes"] = random.randint(10, 50)

            v["last_ping"] = datetime.utcnow().isoformat() + "Z"
            events["fleet_positions"].append({**v})

        # 2. Progress orders
        for o in self.orders:
            if o["status"] == "delivered":
                continue
            if random.random() < 0.08:
                idx = ORDER_STATUSES.index(o["status"]) if o["status"] in ORDER_STATUSES else 0
                if idx < len(ORDER_STATUSES) - 2:  # don't auto-return
                    next_status = ORDER_STATUSES[idx + 1]
                    o["status"] = next_status
                    progress_map = {"pending": 0, "picked-up": 15, "in-transit": 50, "out-for-delivery": 85, "delivered": 100}
                    o["progress"] = progress_map.get(next_status, o["progress"] + 10)
                    o["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                    if next_status == "in-transit":
                        o["vehicleId"] = random.choice(self.fleet)["vehicleId"]
                    if next_status == "delivered":
                        o["eta_minutes"] = 0
                        o["progress"] = 100
                    events["order_updates"].append({
                        "orderId": o["orderId"],
                        "previousStatus": ORDER_STATUSES[idx],
                        "newStatus": next_status,
                        "timestamp": o["updatedAt"],
                    })
            elif o["eta_minutes"] > 0:
                o["eta_minutes"] = max(0, o["eta_minutes"] - random.uniform(0.3, 1.5))
                o["progress"] = min(99, o["progress"] + random.uniform(0.2, 1.0))

        # 3. Occasional alerts
        if random.random() < 0.12:
            tpl = random.choice(ALERT_TYPES)
            vehicle = random.choice(self.fleet)
            order = random.choice([o for o in self.orders if o["status"] != "delivered"] or self.orders)
            alert = {
                "alertId": f"ALT-{uuid.uuid4().hex[:6].upper()}",
                "type": tpl["type"],
                "severity": tpl["severity"],
                "message": tpl["message"].format(vehicle_id=vehicle["vehicleId"], order_id=order["orderId"]),
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "vehicleId": vehicle["vehicleId"],
                "lat": vehicle["lat"],
                "lng": vehicle["lng"],
            }
            self.alerts.append(alert)
            if len(self.alerts) > 50:
                self.alerts = self.alerts[-50:]
            events["alerts"].append(alert)

        # 4. Aggregate metrics
        active_vehicles = [v for v in self.fleet if v["status"] == "en-route"]
        in_transit_orders = [o for o in self.orders if o["status"] in ("in-transit", "out-for-delivery")]
        delivered_orders = [o for o in self.orders if o["status"] == "delivered"]
        events["metrics"] = {
            "totalFleetSize": len(self.fleet),
            "activeVehicles": len(active_vehicles),
            "idleVehicles": len([v for v in self.fleet if v["status"] == "idle"]),
            "returningVehicles": len([v for v in self.fleet if v["status"] == "returning"]),
            "fleetUtilization": round(len(active_vehicles) / max(1, len(self.fleet)) * 100, 1),
            "totalOrders": len(self.orders),
            "ordersInTransit": len(in_transit_orders),
            "ordersDelivered": len(delivered_orders),
            "ordersPending": len([o for o in self.orders if o["status"] == "pending"]),
            "avgETA": round(sum(o["eta_minutes"] for o in in_transit_orders) / max(1, len(in_transit_orders)), 1),
            "totalCarbonSaved_kg": round(sum(o["carbonSaved_kg"] for o in self.orders), 1),
            "onTimeRate": round(random.uniform(88, 97), 1),
            "alertCount": len(self.alerts),
            "avgSpeed_kmh": round(sum(v["speed_kmh"] for v in active_vehicles) / max(1, len(active_vehicles)), 1),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        return events

    # ------------------------------------------------------------------
    # Snapshot helpers (for REST fallback)
    # ------------------------------------------------------------------
    def get_fleet_snapshot(self) -> List[Dict]:
        return [{**v} for v in self.fleet]

    def get_orders_snapshot(self) -> List[Dict]:
        return [{**o} for o in self.orders]

    def get_alerts(self) -> List[Dict]:
        return list(reversed(self.alerts[-20:]))

    def get_metrics(self) -> Dict:
        active = [v for v in self.fleet if v["status"] == "en-route"]
        in_transit = [o for o in self.orders if o["status"] in ("in-transit", "out-for-delivery")]
        delivered = [o for o in self.orders if o["status"] == "delivered"]
        return {
            "totalFleetSize": len(self.fleet),
            "activeVehicles": len(active),
            "idleVehicles": len([v for v in self.fleet if v["status"] == "idle"]),
            "returningVehicles": len([v for v in self.fleet if v["status"] == "returning"]),
            "fleetUtilization": round(len(active) / max(1, len(self.fleet)) * 100, 1),
            "totalOrders": len(self.orders),
            "ordersInTransit": len(in_transit),
            "ordersDelivered": len(delivered),
            "ordersPending": len([o for o in self.orders if o["status"] == "pending"]),
            "avgETA": round(sum(o["eta_minutes"] for o in in_transit) / max(1, len(in_transit)), 1),
            "totalCarbonSaved_kg": round(sum(o["carbonSaved_kg"] for o in self.orders), 1),
            "onTimeRate": round(random.uniform(88, 97), 1),
            "alertCount": len(self.alerts),
            "avgSpeed_kmh": round(sum(v["speed_kmh"] for v in active) / max(1, len(active)), 1),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
