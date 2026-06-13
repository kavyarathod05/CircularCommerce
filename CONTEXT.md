# SecondLife Commerce — Full Project Context

> **Hackathon**: HackOn with Amazon — Season 6.0 | **Theme 3**: Second Life Commerce (AI-Powered Returns & Sustainable Resale)
> **Stack**: React Native → AWS API Gateway + Lambda (Go) → DynamoDB + S3 + Amazon Bedrock (Nova Pro) + Rekognition
> **Team**: Kavya (AWS & Infrastructure) + Naman (ML/AI & Frontend)

SecondLife Commerce is an AWS-powered reverse commerce platform that automates returns grading and intercept routing. It matches returned items directly to local buyers or drop nodes, bypassing central warehouses.

---

# SECTION 1: PRODUCT VISION & STRATEGY

## Mission
Give every returned product its best possible second life — intelligently, sustainably, and profitably.

## Vision
The operating system for circular commerce. No returned product needlessly destroyed, every buyer trusts secondhand products, reverse logistics flows as efficiently as forward logistics — powered by AI, driven by hyperlocal intelligence, verified by transparency.

## Core Philosophy: "Prevent Before Sale" & "Bypass the Warehouse"

- **Pillar 01: Interception** — Match returned items directly with new buyers locally before warehouse routing.
- **Pillar 02: AI Inspection** — Instant, automated condition grading using generative AI (Amazon Nova Pro).
- **Pillar 03: Transparency** — Tamper-evident condition certificates + Digital Product Passports.
- **Pillar 04: Prevention** — Pre-purchase intercept via Virtual Try-On (VTO) + AI Size Recommendation + behavioral friction.

## The "Direct-to-Next-Owner" Intercept Engine
When User A returns a product, multimodal AI grades it. A spatial matching algorithm (DynamoDB Geohash) queries for a secondary buyer in closest physical proximity. Amazon Location Service Route Matrix API calculates optimal P2P route. Smart Escrow captures buyer funds. User A ships directly to User B. Amazon acts as trusted validator, updates carbon offsets, and secures margins without warehousing.

## Customer Value Proposition
- Instant refunds (no 7–14 day warehouse wait)
- Full visibility into where returned product goes
- Buy verified, AI-graded second-life products at trusted prices
- Carbon impact score for every action

## Marketplace Value Proposition
- Convert returns from cost centers into revenue assets
- Margin Triage Gate: Track A (Premium) vs Track B (Commodity) splits processing
- Reduce warehouse intake by up to 40% via hyperlocal matching
- AI-graded condition certificates reduce disputes and fraud

## Seller Value Proposition
- Automated AI inspection replacing manual grading
- Smart routing maximizes recovery value per item
- Transparent certificates build buyer trust
- Carbon savings as brandable credential

## Why Existing Solutions Fail
| Approach | Failure |
|---|---|
| Traditional Returns | Warehouse-centric, slow, expensive, opaque |
| Manual Inspection | Inconsistent grading, bottlenecks, fraud-prone |
| Legacy Resale Platforms | No supply chain integration, no AI grading |
| Carrier-Led Returns | No intelligence on product routing |
| Brand Refurb Programs | Siloed, brand-only, no marketplace reach |

---

# SECTION 2: AWS SYSTEM ARCHITECTURE

## Updated Tech Stack Layer Mapping

| Layer | AWS Technology | Justification |
|---|---|---|
| **Frontend UI/UX** | React Native | Cross-platform mobile, camera access for image capture, GPS for spatial mapping |
| **Backend & Orchestration** | AWS API Gateway & AWS Lambda | Serverless for unpredictable return volume spikes |
| **Data & Spatial Indexing** | Amazon DynamoDB (Geo Library) | 64-bit Geohash indexing, O(1) spatial proximity lookups |
| **Logistics Routing** | Amazon Location Service | Route Matrix API for real travel times/distances across 100k+ nodes |
| **AI/ML (Vision & Defect)** | Amazon Bedrock (Nova Pro) | Zero-training multimodal LLM for zero-shot visual defect classification |
| **AI/ML (Fraud & Spoofing)** | Amazon Rekognition | Passive liveness checks, deepfake/GAN artifact detection |
| **AI/ML (Verification)** | Bedrock Knowledge Bases (Nova Embeddings) | Multimodal vector embeddings for visual similarity "switched goods" detection |

## 5 Core Architectural Innovations

### 1. Geospatial P2P Routing via DynamoDB Geohashing
- Translates lat/lng into 64-bit Geohash stored in DynamoDB LSI
- Proximity queries via geohash prefix bounding box (first 6 chars = localized radius)
- B-Tree sorting, horizontal scalability, single-digit ms latency
- Adaptive Capacity prevents partition hotspots in dense urban areas

### 2. Distance Matrix via Amazon Location Service
- Route Matrix API calculates travel times factoring real-time traffic and road networks
- Single API request handles up to 122,500 routes (350 origins × 350 destinations)
- Optimizes unit economics down to the cent before generating shipping label

### 3. Visual Defect Detection via Amazon Nova Pro
- Zero-shot learning via natural language prompts (no training data needed)
- Agentic workflow: evaluates image quality first (contrast, Laplacian sharpness)
- If blurry → prompts retake; if damage detected → overrides P2P, routes to refurb hub
- Latency target: < 2 seconds

### 4. Synthetic Fraud Mitigation via Amazon Rekognition
- Detects GAN artifacts, pixel tampering, digital watermarks in uploaded images
- Face Liveness (ISO 30107-3 compliant) via passive analysis — no blinking/smiling required
- Blocks bots, printed photos, 3D masks during onboarding and high-value handoffs

### 5. Multimodal Embedding for Product Verification
- Amazon Nova Multimodal Embeddings: unified semantic space for text + images
- Cross-modal visual similarity search verifies returned item matches original SKU
- Flags "switched goods" fraud instantly

## Service Interaction
```
React Native App → AWS API Gateway → Lambda (Return Intercept Engine)
  → Rekognition (Identity/Spoof Check)
  → Bedrock Knowledge Bases (Product Verification)
  → Nova Pro (Damage Assessment, Bounding Boxes)
  → GNNs (Device/Account Hash, Trust Score)
  → DynamoDB Geo Library (Find Nearby Buyers)
  → Location Service (Route Matrix, ETA)
  → Dynamic Pricing Engine
  → Smart Escrow (Funds Locking)
  → DynamoDB (Listings, Orders, Returns, Matches)
  → Digital Product Passport
  → Scope-3 Carbon Tracker
  → Business Analytics
```

---

# SECTION 3: GO BACKEND SERVICES & API SPECIFICATIONS

## Microservices (all in Go Lambda monolith)

### User Service
- Registration, authentication, profile, trust score
- `POST /users/register`, `POST /users/login`, `GET /users/{id}/profile`, `PUT /users/{id}/preferences`

### Inspection Service
- Receive photos, invoke Bedrock (Nova Pro), parse results, generate certificate, store in DynamoDB/S3
- `POST /inspections`, `GET /inspections/{id}`, `GET /inspections/{id}/certificate`

### Routing Service
- Execute Margin Triage Gate, evaluate inspection + seller prefs + demand → routing decision
- `POST /routing/decide`, `GET /routing/{return_id}`

### Marketplace Service
- Create/manage second-life listings, search, purchase
- `POST /listings`, `GET /listings/{id}`, `GET /listings/search`, `POST /listings/{id}/purchase`

### Carbon Service
- Calculate carbon savings per routing, aggregate metrics, generate reports
- `GET /carbon/transaction/{return_id}`, `GET /carbon/user/{user_id}`, `GET /carbon/platform/summary`

### Analytics Service
- Aggregate KPIs, export to S3
- `GET /analytics/seller/{id}/dashboard`, `GET /analytics/platform/recovery`

## Key API Payloads

### Pre-Checkout Intercept: `POST /v1/checkout/intercept`
Request: `{ "userId", "cartItems": [{ "productId", "category", "size" }] }`
Response: `{ "intercept": true, "warningType": "sizing_anomaly", "message": "...", "riskScore": 0.85 }`

### Initiate Return: `POST /v1/returns`
Request: `{ "orderId", "productId", "reason", "description" }`
Response: `{ "returnId", "status": "initiated", "inspectionUploadUrl": "presigned-s3-url" }`

### Submit Inspection: `POST /v1/inspections`
Request: multipart/form-data with returnId + photos
Response: `{ "inspectionId", "status": "processing", "estimatedCompletionSeconds": 45 }`

### Get Inspection Result: `GET /v1/inspections/{inspectionId}`
Response: `{ "grade": "B", "damages": [{ "type", "severity", "location" }], "fraudSignals": [], "confidenceScore": 0.94, "certificateUrl", "summary" }`

### Get Routing Decision: `GET /v1/routing/{returnId}`
Response: `{ "pathway": "hyperlocal", "reasoning": "...", "estimatedRecoveryValue": 1850, "carbonSavedKg": 2.3 }`

### Search Listings: `GET /v1/listings/search?category=electronics&grade=B&maxPrice=2000&lat=19.0&lng=72.8&radius=25`
Response: `{ "listings": [{ "listingId", "productName", "grade", "askingPrice", "distanceKm", "certificateUrl" }] }`

### Carbon Summary: `GET /v1/carbon/user/{userId}/summary`
Response: `{ "totalCo2SavedKg": 18.4, "totalReturns": 7, "treeEquivalent": 0.87, "ecoPoints": 340, "tier": "Eco Warrior" }`

### Prevention Score: `POST /v1/prevention/score`
Request: `{ "userId", "productId", "selectedVariant" }`
Response: `{ "returnProbability": 0.67, "recommendation": "...", "alternativeVariant": "size_8", "confidenceScore": 0.89 }`

---

# SECTION 4: AI DESIGN & CORE ALGORITHMS

## Primary Model: Amazon Nova Pro (multimodal LLM on Bedrock) — zero-shot visual defect classification. Latency < 2s.

## Image Inspection System Prompt
```
You are an expert product condition inspector for a reverse commerce platform.
Analyze 3-5 images and return JSON: { "grade": "A|B|C|D", "gradeReasoning", "damages": [{ "type", "severity": 1-10, "location", "description" }], "packagingCondition", "functionalityAssessment", "repairCostBracket", "fraudSignals": [{ "type", "confidence": 0-1, "description" }], "summary", "confidenceScore": 0-1 }
Grade A=Like New, B=Good (minor cosmetic), C=Fair (visible wear), D=Poor (significant damage).
```

## Fraud Risk Assessment (Go)
```go
func assessFraudRisk(inspection, user) {
    score from fraud signals (confidence * 10) + high return count with low trust (+20)
    score > 30 → HIGH risk → manual_review
    score ≤ 30 → LOW risk → auto_approve
}
```

## AI-Generated Listing Copy
Takes inspection JSON + product name + price → honest 3-4 sentence listing with trust statement about AI certificate.

## Pre-Checkout Prevention
Bedrock prompt: given buyer history + return pattern + product specs → predict return likelihood.
If > 40% → surface proactive size/VTO recommendation.

## Advanced ML Models
- **Virtual Try-On (VTO)**: Diffusion/GAN models to drape clothing over user photos — eliminates bracketing
- **AI Size Recommendation**: RF, KNN, CNN, XGBoost ensemble — injects dynamic UI friction
- **GenAI Dynamic Pricing**: Demand-aware discounts, inventory liquidity optimization
- **Heterogeneous GNNs (SEFraud)**: Multi-accounting detection, graph-based node overlap, Trust Score calculation

---

# SECTION 5: DATABASE & SECURITY

## DynamoDB Single-Table Design

### Users: PK `USER#{userId}` | SK `PROFILE`
Attrs: userId, email, role (customer/seller/ops), trustScore (0-100), ecoPoints, location {lat,lng}, preferences
GSI: EmailIndex

### Products: PK `PRODUCT#{productId}` | SK `METADATA`
Attrs: productId, sellerId, name, category, originalPrice, catalogImages (S3 URLs)

### Returns: PK `RETURN#{returnId}` | SK `STATUS`
Attrs: returnId, userId, productId, orderId, reason, status (initiated/inspected/routed/completed)
GSIs: UserReturnsIndex, SellerReturnsIndex

### Inspections: PK `INSPECTION#{inspectionId}` | SK `RESULT`
Attrs: inspectionId, returnId, grade (A/B/C/D), damages[], fraudSignals[], confidenceScore, certificateUrl, imageUrls[]
GSI: ReturnInspectionIndex

### Routing: PK `ROUTING#{returnId}` | SK `DECISION`
Attrs: pathway, reasoning, sellerOverride, consolidationNodeId, nodeProximityKm

### Listings: PK `LISTING#{listingId}` | SK `DETAIL`
Attrs: listingId, returnId, productId, grade, askingPrice, status (available/sold/removed), certificateUrl, location
GSIs: CategoryGradeIndex, StatusIndex

### Carbon: PK `CARBON#{returnId}` | SK `METRIC`
Attrs: userId, sellerId, co2SavedKg, transportLegsAvoided, warehouseDaysAvoided, pathway
GSIs: UserCarbonIndex, SellerCarbonIndex

### Events: PK `EVENT#{eventId}` | SK `TS#{timestamp}`
Attrs: eventType, entityId, payload

## Security
- **Auth**: Custom JWT in Go Lambda, sessions in DynamoDB
- **RBAC**: customer / seller / ops_refurb / ops_warehouse via middleware
- **Fraud**: Rekognition liveness + GAN detection + GNN Trust Scores + Velocity checks (3 returns/7 days)
- **Crypto**: KMS-signed SHA256 condition certificates (tamper-evident)
- **Uploads**: S3 pre-signed URLs (15-min expiry)
- **Privacy**: KMS CMK encryption at rest, GDPR/CCPA deletion via scheduled Lambda

---

# SECTION 6: TRIAGE ROUTING ENGINE

## Pre-Label Triage Gate
When `Logistics Overhead ≥ Net Residual Value`, block warehouse route. Branch BEFORE return label is generated.

## Track A — High-Value (≥ ₹50,000)
- **Frontend**: Live video scan with frame buffer tracking (detects pre-recorded screens)
- **Backend**: Nova Pro forensic grading — serial/IMEI extraction, cross-reference purchase DB
- **Rekognition**: Liveness + deepfake detection
- **Bedrock KB**: Nova Embeddings for switched goods verification
- **Outcomes**: Grade A+Clean → P2P Intercept | Grade B+Clean → Premium Fulfillment | Fraud → account freeze

## Track B — Low-Value (≤ ₹500) — 3 Sequential Solutions

### Solution 1: Micro-Consolidation Locker
- Query GPS proximity to Amazon Lockers/kiosks within 2km via DynamoDB Geo Library
- Instant refund on drop-off scan, no packaging needed
- Weekly bulk pickup (₹80→₹2 per item)

### Solution 2: Geo-Proximity Neighbor Swap
- Search active checkout carts for identical item within 2km
- P2P transfer via local gig-delivery agent

### Solution 3: Eco-Registry (Keep-and-Credit)
- User keeps item, gets Green Credits (redeemable only on Open-Box listings)
- Requires: returnCount ≤ 3 AND trustScore ≥ 70
- GNN flags repeat abusers → revoke privileges

---

# SECTION 7: CORE FUNCTIONAL MODULES

## 1. Pre-Purchase Prevention (VTO + Size AI)
- Virtual Try-On: AI-driven realistic on-model product images based on user body shape
- AI Size Recommendation: RF, KNN, CNN, XGBoost ensemble
- Reduces bracketing by 80%, increases conversion by 35-40%

## 2. AI Product Inspection (Nova Pro)
- Zero-shot defect detection via natural language prompts
- Agentic workflow: checks image quality before processing
- Grades: A (Like New), B (Good), C (Fair), D (Poor)
- Bounding box damage map overlay

## 3. Smart Routing Engine
- Margin Triage Gate → Track A (≥₹5000) vs Track B (<₹5000)
- Decision Matrix: Grade × Repair Cost × Local Demand → pathway
- Seller overrides supported

## 4. Hyperlocal Demand Matching
- DynamoDB Geo Library geohash queries for nearby buyers
- Amazon Location Service Route Matrix for actual travel times
- 2-hour locked offer → cascade fallback

## 5. Smart Escrow & Transaction Trust
- Funds captured in escrow on secondary buyer purchase
- Released to retailer on verified delivery confirmation
- AI-based automated dispute resolution (weight differentials, crypto hashes, carrier data)

## 6. Digital Product Passport (DPP)
- EU ESPR 2026 compliance
- Records ownership changes, verified condition, carbon savings per P2P route
- Cryptographically verified provenance — eradicates counterfeit goods

## 7. Carbon Optimization Engine
- Scope 3 emissions tracking (26× greater than direct operational emissions)
- CO₂ = distance delta × emission factor × vehicle type
- Automated ESG reports for CSRD/TCFD compliance

## 8. GenAI Dynamic Pricing
- Real-time demand signals, localized inventory levels, competitor behavior
- Auto-increments discount if item unclaimed within 48 hours
- Finds optimal price equilibrium for maximum revenue recovery

## 9. Trust & Transparency Engine
- Digital Condition Certificate: KMS-signed SHA256 hash, QR code
- Rekognition liveness + deepfake detection
- GNN-based Trust Scores

---

# SECTION 8: UX INNOVATION & FRONTEND AESTHETIC MANIFESTO

## Design Mandate
- **Reject generic "AI slop" aesthetics** — no templates, no standard SaaS dashboards
- Choose ONE bold extreme: Industrial/Utilitarian OR Editorial/Magazine
- **Typography**: No Arial/Roboto/Inter — use characterful display font + legible body font
- **Color Palette**: 4-6 named hex values from physical world (Cardboard Brown, Safety Orange, Denim Blue, Receipt Paper White)
- **Layout**: Break standard grids — asymmetry, overlapping, diagonal flows
- **Motion**: One orchestrated page-load sequence, not scattered micro-interactions
- **Signature Element**: Every view must have one bold, memorable element
- **No generics**: Eliminate bootstrap-style padding and generic class naming

## Customer Dashboard
- Active Returns Timeline, Carbon Impact (CO₂, trees, distance)
- Eco-Points Wallet (Green Starter → Eco Warrior → Planet Champion)
- History Map showing where returned items went

## Seller Dashboard
- Telemetry charts (recovery value, warehouse avoidance, carbon certificates)
- Consolidation manifests, listing copy approval

## Interactive Return Wizard
- One-tap return, swipeable reason carousel
- Real-time AI progress ("Analyzing cosmetic state... ✓")
- Interactive Damage Heatmap with clickable bounding boxes
- Live routing map

## Product Health Card
- Visual condition meter (A=Green→D=Red), damage map, pricing rationale, QR verification

## Gamification
- Eco-Points: +50 locker drop-off, +100 P2P handoff
- Leaderboards, Green Credits (restricted currency), partner incentives

---

# SECTION 9: OUT-OF-THE-BOX FEATURES (Hackathon Differentiators)

1. **Virtual Try-On (VTO)**: Eliminates bracketing returns — 80% reduction
2. **Smart Escrow**: Automated dispute resolution via AI cross-referencing
3. **Digital Product Passport (DPP)**: EU ESPR 2026 compliance, anti-counterfeit
4. **GenAI Dynamic Pricing**: Demand-aware discounts preventing obsolescence
5. **Scope 3 Emissions + Smart Packaging**: Automated ESG reports, reusable container tracking

---

# SECTION 10: OPEN-SOURCE COMPONENT MAP

| Purpose | Library | Use |
|---|---|---|
| Marketplace UI | vercel/commerce | Next.js storefront structure |
| Admin Dashboard | tremorlabs/tremor | Charts, KPI grids, carbon widgets |
| UI Primitives | shadcn-ui/ui | Cards, badges, dialogs, progress bars |
| Mobile Layouts | adrianhajdin/ecommerce | Mobile-first return wizard |
| Image Encoding | openai/openai-cookbook | Base64 pipelines for Bedrock |
| Damage Overlays | ultralytics/ultralytics | Bounding box rendering via Canvas |
| Return Prediction | Customer-returns-prediction | Risk coefficients for prevention |
| Maps | mapbox/mapbox-gl-js | P2P route visualization |
| Cluster Maps | Leaflet/Leaflet | Locker monitoring clusters |
| Telemetry | gurbaaz27/amazon-hackathon | Session dwell time tracking |
| Recommendations | microsoft/recommenders | Content-based filtering |
| Serverless | aws-samples/serverless-patterns | SAM/EventBridge templates |
| Go SDK | google/go-cloud | S3/SQS wrappers |
| State Machine | sharetribe/sharetribe | Listing lifecycle transitions |
| Condition Standards | eBay/ebay-sdk-python | Product condition taxonomies |
| Emission Factors | thegreenwebfoundation/co2.js | CO₂ per km constants |
| Carbon Visuals | climateiq/climateiq-frontend | Tree/distance equivalence displays |

---

# SECTION 11: 5-PHASE EXECUTION PLAN

## Build vs Buy
| Component | Strategy | Tool |
|---|---|---|
| Computer Vision | INTEGRATE (Buy) | Amazon Bedrock / Rekognition |
| Predictive Risk | REUSE (Fork) | Scikit-Learn + Kaggle |
| Admin Analytics UI | REUSE (Template) | Tremor + Tailwind |
| P2P Intercept Logic | BUILD (Scratch) | Custom routing algorithms |

## Phase 1: Foundation & Core Workflows
- Infrastructure: CDK/SAM → DynamoDB, API Gateway, Lambda
- Frontend: React Native App with custom aesthetic manifesto design system
- Core Backend (Go): Return Intercept Engine, DynamoDB tables
- Margin Triage Gateway, Return Flow, Device Security
- Basic Scope-3 Carbon Tracker

## Phase 2: Spatial Logistics & Matching
- DynamoDB Geo Library + Geohash integration
- Local Demand Engine with buyer ranking
- Amazon Location Service Route Matrix
- Commodity fallback: Locker or Keep-and-Credit

## Phase 3: Financials & Escrow
- Smart Escrow with fund capture and release rules
- Digital Product Passport schema
- Admin Telemetry Dashboard (Tremor)
- Carbon visualizers

## Phase 4: Core AI Defect & Fraud Detection
- Nova Pro damage assessment + bounding boxes
- Bedrock Knowledge Bases for swapped goods detection
- Rekognition Face Liveness + deepfake detection

## Phase 5: Generative, Predictive & Advanced ML
- Virtual Try-On (VTO) engine
- AI Size Recommendation (RF, KNN, CNN, XGBoost)
- Predictive friction + dynamic UI injection
- GenAI Dynamic Pricing
- Heterogeneous GNNs (SEFraud) for Trust Scores

---

# SECTION 12: TEAM TASK SPLIT

## Kavya (AWS & Infrastructure)
- All AWS services (Lambda, DynamoDB, API Gateway, Location Service)
- Core Go routing backend, data persistence, infrastructure
- Smart Escrow backend, DPP schema, Step Functions orchestration
- Verification routing to ML endpoints

## Naman (ML/AI & Frontend)
- All AI/ML models (Bedrock, Nova Pro, Rekognition, VTO, Predictive Friction, Dynamic Pricing, GNNs)
- Frontend with custom aesthetic manifesto (bold typography, distinctive palette)
- Return flow UI, damage bounding boxes via Canvas
- Admin dashboard, carbon visualizers
- VTO interface as "Signature Element" of the app

---

# SECTION 13: DEPLOYMENT & ORCHESTRATION

## Prerequisites
- AWS CLI (admin), Node.js v18+, Go v1.20+, AWS CDK CLI

## Steps
```
1. cdk bootstrap aws://ACCOUNT_ID/us-east-1          (once per account/region)
2. cdk deploy SecondLifeCoreStack                     (DynamoDB + S3 + IAM)
3. cd /backend && GOOS=linux GOARCH=amd64 go build    (compile Go Lambda)
4. cdk deploy SecondLifeBackendStack                  (Lambda + Function URL)
5. go run seed_simulator.go                           (seed 1,000+ demo entries)
6. cd /frontend && npm install && npm run dev          (launch React Native app)
```

## Project Structure (Target)
```
/frontend          — React Native (Customer App, Seller Dashboard, Admin Portal)
/backend           — Go Lambda monolith (all microservices in one binary)
  /cmd/backend     — main.go entry point
  /scripts         — seed_simulator.go
/infra             — AWS CDK stacks (TypeScript)
/docs              — All documentation
```
