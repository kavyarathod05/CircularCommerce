"""
SecondLife Commerce — Regulatory Compliance Engine
=================================================
Enforces category-specific restrictions for P2P routing:
- FDA regulations (cosmetics, medical devices)
- Safety recalls (car seats, airbags)
- Shipping restrictions (lithium batteries, hazmat)
- Consumer protection laws (warranty requirements)
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta

class RegulatoryComplianceEngine:
    """
    Checks if products can be legally routed to P2P or require centralized processing.
    """
    
    def __init__(self):
        # Category-specific restrictions
        self.restricted_categories = {
            "cosmetics": {
                "p2p_allowed": False,
                "reason": "FDA 21 CFR 700.27 - Opened cosmetics cannot be resold",
                "alternative_pathway": "recycle",
                "reference": "https://www.fda.gov/cosmetics/cosmetics-laws-regulations"
            },
            "personal_care": {
                "p2p_allowed": False,
                "reason": "FDA tamper-evident packaging requirements",
                "alternative_pathway": "recycle",
                "reference": "FDA CFR Title 21"
            },
            "baby_products": {
                "p2p_allowed": True,
                "restrictions": [
                    "expiration_date_check",
                    "recall_verification",
                    "safety_standard_compliance"
                ],
                "reason": "CPSC safety standards - must verify no recalls",
                "reference": "CPSC 16 CFR 1112"
            },
            "car_seats": {
                "p2p_allowed": False,
                "reason": "NHTSA Federal Motor Vehicle Safety Standards - Expiration dates mandatory, crash history unknown",
                "alternative_pathway": "recycle",
                "reference": "FMVSS 213"
            },
            "medical_devices": {
                "p2p_allowed": False,
                "reason": "FDA 21 CFR 820 - Requires FDA clearance for resale, sterility concerns",
                "alternative_pathway": "refurbish",
                "certification_required": "FDA 510(k)",
                "reference": "FDA Medical Device Regulations"
            },
            "prescription_items": {
                "p2p_allowed": False,
                "reason": "DEA Controlled Substances Act - Prescription eyewear, hearing aids require professional verification",
                "alternative_pathway": "refurbish",
                "reference": "21 USC 811"
            },
            "lithium_batteries": {
                "p2p_allowed": True,
                "restrictions": [
                    "ground_shipping_only",
                    "iata_packaging_compliance",
                    "fire_hazard_disclosure"
                ],
                "reason": "DOT/IATA lithium battery shipping regulations",
                "reference": "49 CFR 173.185"
            },
            "airbags": {
                "p2p_allowed": False,
                "reason": "NHTSA safety recall history - Defective airbags can be lethal",
                "alternative_pathway": "recycle",
                "reference": "TREAD Act"
            },
            "helmets": {
                "p2p_allowed": False,
                "reason": "DOT/Snell certification void after first impact - Crash history unknown",
                "alternative_pathway": "recycle",
                "reference": "FMVSS 218"
            },
            "infant_formula": {
                "p2p_allowed": False,
                "reason": "FDA tamper-evident + expiration strict enforcement",
                "alternative_pathway": "recycle",
                "reference": "FDA IFSIA"
            },
            "mattresses": {
                "p2p_allowed": True,
                "restrictions": [
                    "fire_safety_label_intact",
                    "sanitization_certificate",
                    "state_specific_laws"
                ],
                "reason": "16 CFR 1633 fire safety standards + state sanitization laws",
                "reference": "Flammable Fabrics Act"
            }
        }
        
        # Known safety recalls database (mock - would integrate with CPSC API)
        self.active_recalls = {
            "PROD-TAKATA-AIRBAG-2016": {
                "severity": "CRITICAL",
                "reason": "Exploding airbags - multiple fatalities",
                "action": "Immediate removal from market"
            },
            "PROD-FISHER-PRICE-ROCKER-2019": {
                "severity": "HIGH",
                "reason": "Infant deaths when used for sleep",
                "action": "Destroy - do not resell"
            }
        }
    
    def check_compliance(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main compliance check function.
        
        Args:
            product_data: {
                "category": str,
                "sub_category": str,
                "product_id": str,
                "manufacture_date": str (ISO format),
                "condition": str (new/used/opened),
                "has_original_packaging": bool,
                "recall_check_id": str (optional)
            }
        
        Returns:
            {
                "compliant": bool,
                "p2p_allowed": bool,
                "restrictions": List[str],
                "required_actions": List[str],
                "recommended_pathway": str,
                "legal_reference": str,
                "warnings": List[str]
            }
        """
        category = product_data.get("category", "").lower()
        sub_category = product_data.get("sub_category", "").lower()
        condition = product_data.get("condition", "used").lower()
        
        # Check if category has restrictions
        if category not in self.restricted_categories:
            # No specific restrictions - P2P allowed
            return {
                "compliant": True,
                "p2p_allowed": True,
                "restrictions": [],
                "required_actions": [],
                "recommended_pathway": "hyperlocal-p2p",
                "legal_reference": "No specific federal restrictions",
                "warnings": []
            }
        
        rules = self.restricted_categories[category]
        warnings = []
        required_actions = []
        
        # Check if P2P is outright forbidden
        if not rules.get("p2p_allowed", False):
            return {
                "compliant": False,
                "p2p_allowed": False,
                "restrictions": [rules["reason"]],
                "required_actions": [f"Route to {rules.get('alternative_pathway', 'recycle')}"],
                "recommended_pathway": rules.get("alternative_pathway", "recycle"),
                "legal_reference": rules.get("reference", ""),
                "warnings": ["P2P routing violates federal regulations for this category"]
            }
        
        # P2P conditionally allowed - check restrictions
        restrictions_list = rules.get("restrictions", [])
        
        for restriction in restrictions_list:
            if restriction == "expiration_date_check":
                # Check if product has expired
                mfg_date_str = product_data.get("manufacture_date")
                if mfg_date_str:
                    try:
                        mfg_date = datetime.fromisoformat(mfg_date_str)
                        # Most baby products: 6-year lifespan
                        expiry = mfg_date + timedelta(days=365*6)
                        if datetime.now() > expiry:
                            warnings.append("Product has exceeded recommended lifespan")
                            required_actions.append("Cannot resell - route to recycle")
                            return {
                                "compliant": False,
                                "p2p_allowed": False,
                                "restrictions": ["Expired product"],
                                "required_actions": required_actions,
                                "recommended_pathway": "recycle",
                                "legal_reference": rules.get("reference", ""),
                                "warnings": warnings
                            }
                    except ValueError:
                        warnings.append("Invalid manufacture date format")
            
            elif restriction == "recall_verification":
                recall_id = product_data.get("recall_check_id")
                if recall_id and recall_id in self.active_recalls:
                    recall_info = self.active_recalls[recall_id]
                    warnings.append(f"RECALL ALERT: {recall_info['reason']}")
                    required_actions.append(recall_info['action'])
                    return {
                        "compliant": False,
                        "p2p_allowed": False,
                        "restrictions": [f"Active {recall_info['severity']} recall"],
                        "required_actions": required_actions,
                        "recommended_pathway": "recycle",
                        "legal_reference": "CPSC Recall Database",
                        "warnings": warnings
                    }
                else:
                    required_actions.append("Verify no active recalls via CPSC API")
            
            elif restriction == "ground_shipping_only":
                required_actions.append("Ship via ground transport only (no air freight)")
                warnings.append("Lithium battery - IATA/DOT restrictions apply")
            
            elif restriction == "fire_hazard_disclosure":
                required_actions.append("Include fire hazard warning in listing")
            
            elif restriction == "sanitization_certificate":
                if not product_data.get("sanitization_verified", False):
                    warnings.append("Requires professional sanitization before resale")
                    required_actions.append("Route to certified sanitization facility")
        
        # If we made it here, P2P is allowed with restrictions
        return {
            "compliant": True,
            "p2p_allowed": True,
            "restrictions": restrictions_list,
            "required_actions": required_actions,
            "recommended_pathway": "hyperlocal-p2p",
            "legal_reference": rules.get("reference", ""),
            "warnings": warnings
        }
    
    def get_category_info(self, category: str) -> Dict[str, Any]:
        """
        Get detailed regulatory information for a category.
        """
        category = category.lower()
        if category in self.restricted_categories:
            return self.restricted_categories[category]
        return {
            "p2p_allowed": True,
            "reason": "No specific restrictions",
            "reference": "General commerce laws apply"
        }

    def check_cpsc_recall(self, product_id: str, brand: str, model: str) -> Dict[str, Any]:
        """
        Mock CPSC recall check (would integrate with real CPSC API in production).
        Real API: https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information
        """
        # Mock implementation
        mock_recall_keywords = ["takata", "fisher-price", "bumbo", "rock-n-play"]
        
        search_text = f"{product_id} {brand} {model}".lower()
        
        for keyword in mock_recall_keywords:
            if keyword in search_text:
                return {
                    "recall_found": True,
                    "severity": "HIGH",
                    "recall_date": "2019-04-12",
                    "details": f"Product contains recalled {keyword} component",
                    "action": "Do not resell - route to recycle/destroy"
                }
        
        return {
            "recall_found": False,
            "details": "No active recalls found",
            "last_checked": datetime.now().isoformat()
        }


if __name__ == "__main__":
    engine = RegulatoryComplianceEngine()
    
    # Test Case 1: Cosmetics (forbidden)
    test1 = engine.check_compliance({
        "category": "cosmetics",
        "product_id": "REVLON-LIPSTICK-001",
        "condition": "opened"
    })
    print("\n=== Test 1: Cosmetics ===")
    print(f"P2P Allowed: {test1['p2p_allowed']}")
    print(f"Reason: {test1['restrictions']}")
    print(f"Alternative: {test1['recommended_pathway']}")
    
    # Test Case 2: Lithium batteries (allowed with restrictions)
    test2 = engine.check_compliance({
        "category": "lithium_batteries",
        "product_id": "BATTERY-PACK-18650",
        "condition": "used"
    })
    print("\n=== Test 2: Lithium Batteries ===")
    print(f"P2P Allowed: {test2['p2p_allowed']}")
    print(f"Restrictions: {test2['restrictions']}")
    print(f"Required Actions: {test2['required_actions']}")
    
    # Test Case 3: Electronics (no restrictions)
    test3 = engine.check_compliance({
        "category": "electronics",
        "product_id": "IPHONE-14-PRO",
        "condition": "used"
    })
    print("\n=== Test 3: Electronics ===")
    print(f"P2P Allowed: {test3['p2p_allowed']}")
    print(f"Pathway: {test3['recommended_pathway']}")
