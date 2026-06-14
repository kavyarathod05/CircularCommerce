"""
SecondLife Commerce — Unit-Level Inventory Architecture
======================================================
Instead of tracking bulk SKUs, this engine tracks the individualized lifecycle
of every single second-hand or returned item. Every item gets a unique Unit ID
and maintains its own condition grade, dynamic pricing, and repair history.
"""

import uuid
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

class UnitInventoryEngine:
    def __init__(self):
        self.sku_catalog = {
            "SKU-HOODIE-M": {"name": "Essentials Cotton Hoodie (M)", "msrp": 1200},
            "SKU-SNEAKER-10": {"name": "Urban Runner Sneakers (10)", "msrp": 3500},
            "SKU-HEADPHONES-BT": {"name": "NoiseCancelling Headphones BT", "msrp": 4500},
        }
        
        self.units_db: Dict[str, Dict[str, Any]] = {}
        self._seed_mock_inventory()

    def _seed_mock_inventory(self):
        """Seed the database with unique, individualized units."""
        conditions = [
            {"grade": "A", "desc": "Pristine, like new", "depreciation": 0.05, "co2_saved": 4.5},
            {"grade": "B", "desc": "Minor cosmetic wear", "depreciation": 0.20, "co2_saved": 5.2},
            {"grade": "C", "desc": "Noticeable wear, fully functional", "depreciation": 0.40, "co2_saved": 8.0},
            {"grade": "D", "desc": "Needs repair", "depreciation": 0.65, "co2_saved": 12.0},
        ]
        
        for sku, meta in self.sku_catalog.items():
            for i in range(random.randint(5, 12)):
                unit_id = f"UNIT-{uuid.uuid4().hex[:6].upper()}"
                cond = random.choice(conditions)
                
                # Dynamic residual value based on condition
                residual_value = meta["msrp"] * (1 - cond["depreciation"])
                
                # Mock repair history
                history = []
                if cond["grade"] in ["B", "C"]:
                    if random.random() > 0.5:
                        history.append({
                            "date": (datetime.now() - timedelta(days=random.randint(2, 30))).strftime("%Y-%m-%d"),
                            "action": "Cleaned & Refurbished",
                            "cost": 150
                        })
                elif cond["grade"] == "D":
                    history.append({
                        "date": (datetime.now() - timedelta(days=random.randint(1, 5))).strftime("%Y-%m-%d"),
                        "action": "Pending Component Replacement",
                        "cost": 450
                    })
                
                self.units_db[unit_id] = {
                    "unit_id": unit_id,
                    "sku": sku,
                    "product_name": meta["name"],
                    "msrp": meta["msrp"],
                    "condition_grade": cond["grade"],
                    "condition_desc": cond["desc"],
                    "residual_value": round(residual_value, 2),
                    "co2_saved_kg": cond["co2_saved"],
                    "repair_history": history,
                    "status": "Available" if cond["grade"] != "D" else "In Repair",
                    "date_acquired": (datetime.now() - timedelta(days=random.randint(1, 60))).strftime("%Y-%m-%d")
                }

    def get_all_units(self) -> List[Dict[str, Any]]:
        return list(self.units_db.values())

    def get_units_by_sku(self, sku: str) -> List[Dict[str, Any]]:
        return [u for u in self.units_db.values() if u["sku"] == sku]

    def get_unit(self, unit_id: str) -> Optional[Dict[str, Any]]:
        return self.units_db.get(unit_id)

    def update_unit_condition(self, unit_id: str, new_grade: str, new_status: str, repair_action: str = None, repair_cost: float = 0) -> Dict[str, Any]:
        """Update a specific unit's condition, simulating a completed repair."""
        if unit_id not in self.units_db:
            return {"error": "Unit not found"}
            
        unit = self.units_db[unit_id]
        unit["condition_grade"] = new_grade
        unit["status"] = new_status
        
        # Adjust value based on new grade
        depreciation_map = {"A": 0.05, "B": 0.20, "C": 0.40, "D": 0.65}
        dep = depreciation_map.get(new_grade, 0.50)
        unit["residual_value"] = round(unit["msrp"] * (1 - dep), 2)
        
        if repair_action:
            unit["repair_history"].append({
                "date": datetime.now().strftime("%Y-%m-%d"),
                "action": repair_action,
                "cost": repair_cost
            })
            
        return unit
