# Go Backend Services & API Specifications

## 1. Go Microservices Design

The backend is written in Go and structured into independent serverless domains executed on AWS Lambda.

### 1.1 User Service
- **Responsibilities**: Registration, authentication, profile management, buyer/seller role assignment, trust score computation.
- **APIs**:
  - `POST /users/register` — create customer/seller account
  - `POST /users/login` — authenticate and return JWT
  - `GET /users/{id}/profile` — fetch profile + trust score
  - `PUT /users/{id}/preferences` — update notification and location preferences
- **Events Emitted**:
  - `user.registered`
  - `user.trust_score_updated`
- **Events Consumed**:
  - `return.fraud_flagged` → update buyer trust score

### 1.2 Inspection Service
- **Responsibilities**: Receive product photos, invoke Bedrock, parse inspection results, generate condition certificate, store in DynamoDB and S3.
- **APIs**:
  - `POST /inspections` — initiate inspection (accept multipart photos + return ID)
  - `GET /inspections/{id}` — fetch inspection result
  - `GET /inspections/{id}/certificate` — fetch/download condition certificate
- **Events Emitted**:
  - `inspection.completed` (with grade, fraud signals, certificate URL)
  - `inspection.fraud_detected`
- **Events Consumed**: None (triggered by return routing request)

### 1.3 Routing Service
- **Responsibilities**: Execute Margin Triage Gate (Track A vs Track B), evaluate inspection result + seller prefs + local demand score → emit routing decision.
- **APIs**:
  - `POST /routing/decide` — receive inspection ID, return routing decision
  - `GET /routing/{return_id}` — fetch routing decision for a return
- **Events Emitted**:
  - `routing.decided` (with pathway: hyperlocal/marketplace/refurb/recycle/donate/liquidate)
- **Events Consumed**:
  - `inspection.completed` → trigger routing decision

### 1.4 Marketplace Service
- **Responsibilities**: Create and manage second-life product listings, search, purchase flow, listing lifecycle.
- **APIs**:
  - `POST /listings` — create new second-life listing
  - `GET /listings/{id}` — fetch listing with product health card
  - `GET /listings/search` — search by category, grade, location, price
  - `POST /listings/{id}/purchase` — initiate purchase
  - `PUT /listings/{id}/status` — update listing status (available/sold/removed)
- **Events Emitted**:
  - `listing.published`
  - `listing.sold`
- **Events Consumed**:
  - `routing.decided` (marketplace path) → auto-create listing

### 1.5 Carbon Service
- **Responsibilities**: Calculate carbon savings per routing decision, aggregate platform-level metrics, generate carbon reports.
- **APIs**:
  - `GET /carbon/transaction/{return_id}` — carbon saved for specific return
  - `GET /carbon/user/{user_id}` — cumulative user carbon impact
  - `GET /carbon/platform/summary` — platform-wide carbon dashboard data
  - `GET /carbon/seller/{seller_id}/report` — seller monthly carbon PDF report
- **Events Emitted**:
  - `carbon.metric_updated`
- **Events Consumed**:
  - `routing.decided` → calculate and store carbon delta
  - `match.accepted` → calculate transport-saved carbon
  - `listing.sold` → close carbon lifecycle for item

### 1.6 Analytics Service
- **Responsibilities**: Aggregate business KPIs, product KPIs, system metrics. Export to S3 for Athena queries.
- **APIs**:
  - `GET /analytics/seller/{id}/dashboard` — seller KPI summary
  - `GET /analytics/platform/recovery` — platform recovery rate metrics
  - `GET /analytics/marketplace/trends` — demand trends by category
- **Events Consumed**: All domain events for aggregation

---

## 2. API Design & Payloads

### Authentication
All endpoints require `Authorization: Bearer <JWT>` unless marked Public.

### Standard Error Response
```json
{
  "error": {
    "code": "INSPECTION_NOT_FOUND",
    "message": "Inspection with ID abc-123 not found",
    "requestId": "req-uuid"
  }
}
```

### 2.1 Pre-Checkout Intercept (Prevention)
* **Path**: `POST /v1/checkout/intercept`
* **Auth**: Required
* **Request Body**:
```json
{
  "userId": "USR-123",
  "cartItems": [
    { "productId": "PROD-456", "category": "apparel", "size": "M" }
  ]
}
```
* **Response 200**:
```json
{
  "intercept": true,
  "warningType": "sizing_anomaly",
  "message": "You frequently return Mediums in this brand. Consider sizing up to Large.",
  "riskScore": 0.85
}
```

### 2.2 Initiate Return
* **Path**: `POST /v1/returns`
* **Auth**: Required (customer)
* **Request Body**:
```json
{
  "orderId": "ORD-123",
  "productId": "PROD-456",
  "reason": "wrong_size",
  "description": "Ordered medium, received small"
}
```
* **Response 201**:
```json
{
  "returnId": "RET-789",
  "status": "initiated",
  "inspectionUploadUrl": "https://presigned-s3-url"
}
```

### 2.3 Submit Inspection Photos
* **Path**: `POST /v1/inspections`
* **Auth**: Required (customer)
* **Request Body**: `multipart/form-data`
  - `returnId`: "RET-789"
  - `photos`: `[file1, file2, file3]`
* **Response 202**:
```json
{
  "inspectionId": "INS-001",
  "status": "processing",
  "estimatedCompletionSeconds": 45
}
```

### 2.4 Get Inspection Result
* **Path**: `GET /v1/inspections/{inspectionId}`
* **Auth**: Required
* **Response 200**:
```json
{
  "inspectionId": "INS-001",
  "grade": "B",
  "damages": [
    { "type": "surface_scratch", "severity": 3, "location": "top_panel" }
  ],
  "fraudSignals": [],
  "confidenceScore": 0.94,
  "certificateUrl": "https://cdn.secondlife.com/certs/INS-001.pdf",
  "summary": "Minor cosmetic scratches on top panel. Fully functional."
}
```

### 2.5 Get Routing Decision
* **Path**: `GET /v1/routing/{returnId}`
* **Auth**: Required
* **Response 200**:
```json
{
  "returnId": "RET-789",
  "pathway": "hyperlocal",
  "reasoning": "Grade B product with high local demand within 15km",
  "estimatedRecoveryValue": 1850,
  "carbonSavedKg": 2.3
}
```

### 2.6 Search Marketplace Listings
* **Path**: `GET /v1/listings/search?category=electronics&grade=B&maxPrice=2000&lat=19.0&lng=72.8&radius=25`
* **Auth**: Public
* **Response 200**:
```json
{
  "listings": [
    {
      "listingId": "LST-001",
      "productName": "Noise-cancelling Headphones",
      "grade": "B",
      "askingPrice": 1850,
      "distanceKm": 8.3,
      "certificateUrl": "..."
    }
  ],
  "total": 12
}
```

### 2.7 Get Carbon Summary (User)
* **Path**: `GET /v1/carbon/user/{userId}/summary`
* **Auth**: Required
* **Response 200**:
```json
{
  "totalCo2SavedKg": 18.4,
  "totalReturns": 7,
  "treeEquivalent": 0.87,
  "ecoPoints": 340,
  "tier": "Eco Warrior"
}
```
