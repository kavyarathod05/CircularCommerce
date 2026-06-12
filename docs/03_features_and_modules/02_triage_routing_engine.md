# Algorithmic Triage Routing Engine

## 1. The Core Problem
Traditional return pipelines treat all products uniformly. This creates a structural failure at the low-value tier:

$$\text{Logistics Overhead} = \text{Shipping Cost} + \text{AI Inspection Compute} + \text{Processing Labor}$$

$$\text{Net Residual Value} = \text{AI-Graded Condition \%} \times \text{Original Item Price}$$

When `Logistics Overhead ≥ Net Residual Value`, the standard warehouse pipeline destroys margin. The system must branch **before** a return label is ever generated.

---

## 2. Pre-Label Triage Routing Gate
Before a return label is created, the Routing Service runs a live margin check:

```go
func evaluateTieredRoute(product Product, inspection Inspection, logistics LogisticsEstimate) RouteTier {
    netResidualValue := inspection.ConditionGradePct * product.OriginalPrice
    logisticsOverhead := logistics.ShippingCost + logistics.InspectComputeCost + logistics.LaborCost

    if logisticsOverhead >= netResidualValue {
        return RouteTier{Tier: "LOW_VALUE", BlockWarehouseRoute: true}
    }
    return RouteTier{Tier: "HIGH_VALUE", BlockWarehouseRoute: false}
}
```

Items classified as `LOW_VALUE` are blocked from standard returns and routed to commodity workflows, while `HIGH_VALUE` items undergo forensic validation.

---

## 3. Track A — High-Value Asset Pipeline (₹50,000+)
**Primary Risk**: Financial fraud, asset theft, and serial swapping.

### Frontend: Multi-Frame AI Forensic Ingestion
- Customers cannot print labels without performing a continuous **live video scan** via the mobile client.
- The UI tracks frame buffers to detect pre-recorded screens or static photographs.
- Minimum frame counts must be satisfied before submission.

### Backend: Bedrock Multimodal Forensic Grading
The Inspection Service triggers an advanced Bedrock prompt:
- Extracts and parses serial numbers/IMEIs from video frames.
- Cross-references product tags against the purchase database.
- Flags frame buffer manipulation or model anomalies as high-risk fraud triggers.
- Generates an immutable, KMS-signed condition report.

### Routing Outcomes
- **Grade A & Clean**: P2P Intercept — match directly to local pending orders.
- **Grade B & Clean**: Insured courier label to Premium Fulfillment Node for Certified Open-Box resale.
- **Fraud flagged**: Lock account, freeze refund, route to manual review queue.

---

## 4. Track B — Low-Value Commodity Pipeline (₹500 and below)
**Primary Risk**: Logistics cost exceeding item value.

To minimize transit expenses, three solutions activate sequentially based on availability:

### Solution 1 — Micro-Consolidation via Spatial Mesh Router
- **Logic**: Queries customer's GPS proximity to Amazon Lockers, partner retail kiosks, or drop-off bins.
- **Action**: If a drop-off node is located within a 2km consolidated radius, it becomes the primary return option.
- **Trigger**: Refund is issued instantly upon drop-off locker scan (no packaging or label required).
- **Consolidation**: Items are held locally. The system schedules a weekly bulk consolidation pickup, converting individual shipments into a single freight event.
- **Cost Impact**: Reductions from ₹80–120 per item to < ₹2.

### Solution 2 — Geo-Proximity Neighbor Swap
- **Logic**: Searches active checkout carts for the identical item within a tight 2km radius of the return initiator.
- **Action**: If a match is found, the system intercepts the return and generates a P2P transfer slip.
- **Delivery**: A local gig-delivery agent performs the neighbor-to-neighbor handoff, bypassing warehouses entirely.
- **Events**: Emits `match.hyperlocal_commodity` to EventBridge.

### Solution 3 — Eco-Registry (Gamified Keep-and-Credit)
Activated only when Solutions 1 & 2 are unavailable.

```go
func evaluateKeepAndCredit(user User) KeepCreditDecision {
    if user.ReturnCount <= 3 && user.TrustScore >= 70 {
        return KeepCreditDecision{
            Allowed:     true,
            RefundType:  "GREEN_CREDITS",
            Restriction: "redeemable_on_certified_open_box_only",
        }
    }
    return KeepCreditDecision{
        Allowed:    false,
        RefundType: "PHYSICAL_RETURN_REQUIRED",
        FraudFlag:  true,
    }
}
```
- **Eco-Points**: The customer keeps the item and receives the refund as **Green Credits** (Eco-Points).
- **Exploitation Guard**: Green Credits are only redeemable for Open-Box listings on the Green Marketplace, preventing fraud cash-outs.
- **Pattern Monitor**: AI flags repeat keep-and-credit requests to prevent abuse. Repeated flags lower the user's trust score and revoke keep-and-credit privileges.

---

## 5. System Routing Matrix Summary

| Metric Vector | High-Value Pipeline (₹50,000+) | Low-Value Pipeline (₹500 and below) |
|---|---|---|
| **Primary Risk** | Financial fraud and asset theft | Logistics cost exceeding item value |
| **Pre-Label Gate** | Video frame-count verification + KMS forensic report | Threshold check blocks warehouse route entirely |
| **Frontend Behavior** | Continuous live video scan with active frame counter | Single image confirmation or locker drop-off QR scan |
| **Backend Engine** | Bedrock multimodal forensic grading + serial/IMEI match | Spatial Mesh node query → 2km Geo-Proximity match → Keep & Credit fraud evaluation |
| **Fraud Defense** | Frame anomaly detection, model mismatch check, account freeze | Behavioral pattern monitoring, Green Credit restriction, privilege revocation |
| **Final Disposition** | Certified Open-Box premium listing or P2P intercept | Locker consolidation → Neighbor swap → Eco-Registry keep with Green Credits |
| **Carbon Logging** | Standard carbon metric per routing decision | Enhanced carbon log — warehouse legs avoided count weighted higher |
| **Refund Trigger** | On KMS certificate generation | On locker scan confirmation or match acceptance |
