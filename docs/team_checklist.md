# Hackathon Team Integration & Execution Checklist

> [!IMPORTANT]
> **No More Client-Side Mocks:** All frontend tabs (Web and Mobile) must transition from simulated client states to live connections with our Go AWS API Gateway and local Python ML FastAPI server. Follow the divided tracks below to complete the integration.

---

## ☁️ Kavya (AWS Infrastructure & Go REST API Integration)

Your focus is wiring up the database actions, listings state changes, and transactional escrow flows between the React Web app and the Go Lambda API Gateway.

### 1. Ingest Return & Media Gateway
- [x] **Presigned S3 Upload:** Ensure the image uploader in the Return Wizard calls `GET /return/media-url` to retrieve the upload token, then performs a binary `PUT` directly to S3.
- [x] **Returns Ingestion:** Ensure `runTriageSimulation` issues a `POST /return/intercept` request to register the return details and compute geohash matching/routing.

### 2. Seller Dashboard Listings & State Machine
- [ ] **Live Listings Fetch:** Replace the hardcoded React array `listings` in `App.tsx` with a live query using `GET /listing` to load available items directly from DynamoDB.
- [ ] **Transition Listing State:** Wire the "Transition State" button to issue a `PUT /listing` payload:
  * Transitions: `available` ➔ `reserved` ➔ `sold`
  * Log the updated buyer ID and timestamp.

### 3. Escrow Operations
- [ ] **Lock Escrow:** When a listing is reserved by a local buyer, call `POST /escrow/lock` to secure the transaction funds.
- [ ] **Release Escrow:** When a trade is marked as complete, call `POST /escrow/release` to transfer locked credits to the returning user.

### 4. Digital Product Passport (DPP)
- [ ] **Ownership History Chain:** Bind the DPP cards to fetch history using `GET /dpp?listing_id=<id>` to render real circular paths, ownership changes, and Scope-3 carbon savings.

---

## 🧠 Naman (AI/ML Models & UI Feature Integration)

Your focus is connecting the web pre-checkout systems and mobile screen interactions to your local Python FastAPI ML microservice on port `8000`.

### 1. Visual Defect Damage Assessment
- [x] **Bedrock Nova Pro Intake:** Ensure the image uploaded by the user is converted to base64 and sent to the FastAPI ML endpoint `POST /api/v1/ml/aws/inspect-condition`.
- [x] **Dynamic Heatmap overlays:** Map the returned coordinates (`xmin`, `ymin`, `xmax`, `ymax`) directly to draw actual SVG defect box markers on the product visualizer instead of hardcoded coordinates.

### 2. Mobile VTO Draping Simulation
- [ ] **Mobile VTO API Hookup:** Connect the Mobile app's select-photo callback in `VTOEngineScreen.js` to call `POST /api/v1/ml/vto/drape` with the base64 user image.
- [ ] **Dynamic Fit Display:** Display the returned size match confidence and fit stress points in the VTO metrics panel dynamically.

### 3. Pre-Checkout Return Prevention
- [ ] **Predictive Friction check:** Connect the checkout action in the Pre-Checkout Tab to query `POST /api/v1/ml/friction/evaluate` with the cart items and purchase history.
- [ ] **Sizing Anomaly alerts:** Wire the checkout listener to evaluate size configurations and display warning cards if sizing deviations are caught by the algorithm.
- [ ] **SEFraud GNN trust scores:** Load the GNN trust score from `GET /api/v1/ml/fraud/trust-score/{user_id}` and apply strict green-credit limits if the trust score falls below a threshold.

### 4. Liveness Verification
- [ ] **Rekognition Liveness Session:** Connect the Mobile camera screen `CameraScreen.js` to call `GET /api/v1/ml/aws/liveness-session` to retrieve the active session token before initiating scans.

