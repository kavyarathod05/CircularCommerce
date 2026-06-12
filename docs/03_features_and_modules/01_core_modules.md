# Core Functional Modules

## 1. AI Product Inspection Module
**Technology**: Amazon Bedrock (Claude 3.5 Sonnet)

### Capabilities
- **Image Analysis**: Accepts 3–5 product photos from the customer or refurb center. Analyzes surface damage, cracks, packaging integrity, and missing components.
- **Condition Grading**:
  - **Grade A (Like New)**: No visible defects, packaging intact.
  - **Grade B (Good)**: Minor cosmetic defects, fully functional.
  - **Grade C (Fair)**: Visible wear, functional with minor issues.
  - **Grade D (Poor)**: Significant damage, requires repair/recycle.
- **Damage Map Overlay**: Generates coordinates and bounding boxes of visual blemishes on the product image to display to the next buyer.
- **Packaging Assessment**: Checks if the original box is present and its condition, which directly scales the resale value.
- **Variant Validation**: Detects if the model or variant returned mismatches catalog records (fraud detection).

---

## 2. Smart Routing Engine
**Technology**: Go Lambda microservice

### Logic Flow
Evaluates the calculated item grade, category, seller preferences, local demand score, and repair cost estimate to decide the optimal resolution pathway.

### Decision Matrix
| Grade | Repair Cost | Local Demand | Routing Decision |
|---|---|---|---|
| A | — | High | Direct-to-next-owner (hyperlocal) |
| A | — | Low | Marketplace relisting |
| B | Low | High | Hyperlocal with disclosure |
| B | Low | Low | Marketplace relisting |
| B | High | Any | Refurbishment center |
| C | Low | Any | Refurbishment → resale |
| C | High | Any | Liquidation or donation |
| D | Any | Any | Recycling or donation |

### Overrides
Sellers can specify threshold configurations (e.g., brand-owner overrides that route all Grade A electronics to certified refurbishment centers or donation pathways for items with retail values below a specified margin).

---

## 3. Hyperlocal Demand Matching Engine
**Technology**: Amazon Location Service + Go Lambda

### Matching Logic
1. **Extraction**: Collects the product category, calculated condition grade, and GPS coordinates of the return initiator.
2. **Proximity Query**: Queries registered buyers who have that item on wishlists or active carts within a 25km radius.
3. **Scoring**: Ranks candidates using a compound score based on:
   - Drive distance (computed via Amazon Location Service routing api)
   - Category interest and engagement recency
   - Price threshold acceptance
4. **Offer Dispatch**: Emits a `match.requested` event and sends a push notification (SNS) to the top candidate with a 2-hour checkout lock.
5. **Fallback**: If rejected or timed out, the offer cascades to candidate #2, or falls back to the Marketplace Relisting pipeline.

---

## 4. Carbon Optimization Engine
**Technology**: AWS Lambda + DynamoDB Metrics

### Carbon Calculation Per Transaction
The engine computes environmental savings dynamically based on the bypassed logistics legs:

| Metric | Calculation Method |
|---|---|
| **Carbon Saved vs. Standard Route** | Distance delta (km) × emission factor (kg/km) × vehicle type |
| **Warehouse Days Avoided** | Average facility hold days × daily warehouse carbon footprint |
| **Transportation Legs Saved** | Avoided warehouse intake/outtake legs × leg average emission |
| **Tree-Equivalent Offset** | Total CO₂ saved (kg) ÷ 21 kg (annual absorption of mature tree) |

---

## 5. Trust & Transparency Engine
**Technology**: Go Lambda + S3 + AWS KMS

### Product Condition Certificate
To resolve buyer hesitation for secondhand items, the platform issues a cryptographically signed digital certificate containing:
- Certificate ID (UUID)
- Product catalog metadata and original retail value
- AI inspection timestamp and Bedrock inspector model version
- Granular grading scores (Cosmetic, Functional, Packaging)
- Bounding-box photo overlays of detected damages
- KMS-signed SHA256 hash verifying certificate integrity
- QR Code pointing to public verification page
