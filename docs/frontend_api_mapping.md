# Frontend API & Seeding Mapping

This document analyzes the frontend applications (both Vite Web and React Native Mobile) to map exactly which APIs they consume, which APIs are currently missing/hardcoded, and what data needs to be seeded into AWS DynamoDB for the system to function dynamically.

## 1. Web Application (`frontend/web/src/App.tsx`)
The web application acts as a high-fidelity visual simulator of the platform.

### Consumed APIs:
1. **`GET /return/media-url` (Go Backend)** - Fetches an S3 presigned URL.
2. **`PUT {S3_URL}` (AWS S3)** - Directly uploads the media file.
3. **`POST /api/v1/ml/aws/inspect-condition` (Local ML Server)** - Evaluates the defect bounding boxes.
4. **`POST /return/intercept` (Go Backend)** - Triggers the core logistics routing.

---

## 2. React Native Mobile App (`frontend/src/screens/`)

### Currently Wired APIs:
- **`ReturnRequestScreen.js`**: Successfully wired to `GET /return/media-url`, AWS S3, and `POST /return/intercept`.
- **`AdminDashboardScreen.js`**: Wired to `fetchAdminMetrics()`. *(Note: This currently hits a dummy promise in `utils/api.js` because the Go Backend does not yet have a `/metrics` endpoint implemented).*

### Hardcoded Screens (Need to be wired to APIs):
1. **`ProductScreen.js`**
   - **Current State:** The dwell time logic and "Sizing Anomaly" alert are completely hardcoded.
   - **Required API:** `POST /api/v1/ml/friction/evaluate` (Local ML Server)
   - **Action Needed:** Wire the `handlePurchaseAttempt` to call the friction ML API instead of using static `if (dwellTime < 10)`.

2. **`VTOEngineScreen.js`**
   - **Current State:** The virtual try-on UI is hardcoded to show "REDUCED TO 8%" and "MAPPED" upon clicking the upload button.
   - **Required API:** `POST /api/v1/ml/vto/drape` (Local ML Server)
   - **Action Needed:** Wire the `handleUploadPhoto` function to convert the image to base64 and send it to the ML engine.

3. **`UserDashboardScreen.js`**
   - **Current State:** Eco-points (3,450), DPP Hash, and Carbon Footprint (18.4 KG) are completely static text.
   - **Required API:** `GET /user/dashboard/{user_id}` and `GET /dpp/{item_id}` (Go Backend).
   - **Action Needed:** The Go backend needs endpoints created to fetch these aggregated user statistics.

---

## 3. Database Seeding Requirements
For the local ML algorithms and Go backend to return dynamic, accurate data instead of crashing or returning empty sets, **Amazon DynamoDB must be seeded.**

### Tables that require seeding:
1. **`OrdersTable`**: Required by `predictive_friction.py` to check the `OriginalPrice` of an item.
2. **`ReturnsTable`**: Required by `predictive_friction.py` to check how many times a `UserId` has returned items in the past 7 days.
3. **`ListingsTable`**: Required by `demand_engine.py` to find local buyers via `Geohash` and `dynamic_pricing.py` to check competitor prices.

### Example Seeding JSON (DynamoDB format):

**`OrdersTable` Seed:**
```json
{
  "OrderId": {"S": "9874-AX"},
  "ProductId": {"S": "p-headphones-premium"},
  "OriginalPrice": {"N": "299.00"},
  "UserId": {"S": "usr-demo-app"}
}
```

**`ReturnsTable` Seed (To trigger friction engine):**
```json
{
  "ReturnId": {"S": "ret-001"},
  "UserId": {"S": "usr-123"},
  "Timestamp": {"N": "1697200000"}
}
```

**`ListingsTable` Seed (To trigger demand engine):**
```json
{
  "ListingId": {"S": "lst-101"},
  "ProductId": {"S": "p-headphones-premium"},
  "Geohash": {"S": "gcpvj"},
  "OwnerId": {"S": "B002"},
  "PriceThreshold": {"N": "400.00"},
  "ElectronicsAffinity": {"N": "0.9"},
  "ApparelAffinity": {"N": "0.2"},
  "RecencyScore": {"N": "0.95"},
  "Status": {"S": "available"},
  "Price": {"N": "250.00"}
}
```

**Next Steps for Execution:** You will need to write a simple Node.js or Python script using `boto3` or `aws-sdk` to bulk-insert these JSON objects into your DynamoDB tables so that the system is fully "alive" for demonstrations!
