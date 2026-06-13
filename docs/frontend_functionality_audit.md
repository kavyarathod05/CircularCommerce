# Frontend Functionality Audit Report

A comprehensive, line-by-line audit of every user-facing feature in the SecondLife Commerce web application (`frontend/src/App.tsx`), tracing each feature from the UI → Backend → AWS to determine if it is **hardcoded**, **connected to backend**, or **fully connected to AWS**.

---

## Legend

| Status | Meaning |
|---|---|
| 🟢 **LIVE** | Frontend calls Backend, Backend calls AWS. Real data flows end-to-end. |
| 🟡 **PARTIAL** | Frontend calls Backend, but Backend uses fallback/simulated logic OR Frontend has a local fallback. |
| 🔴 **HARDCODED** | Data is written directly into the React JSX. No API call is made. |

---

## Buyer Journey

### 1. Browse Catalog Tab
| Feature | Status | Details |
|---|---|---|
| Product cards (Bose, iPhone, Hoodie) | 🔴 HARDCODED | Product names, prices (₹7,900 / ₹95,000 / ₹2,999), descriptions, and stock status are all static strings in `App.tsx` lines 434–490. No API call fetches product data. |
| Product images | 🔴 HARDCODED | URLs point to Unsplash (`images.unsplash.com`). No S3 or backend catalog API is called. |
| "Add to Cart" button | 🔴 HARDCODED | Simply switches the active tab to `prevention`. No cart API or DynamoDB write occurs. |
| "Try Before You Buy" button | 🔴 HARDCODED | Simply switches the active tab to `vto`. No VTO API is triggered. |

---

### 2. Virtual Try-On (VTO) Tab
| Feature | Status | Details |
|---|---|---|
| Photo upload | 🔴 HARDCODED | Uses `handleFileChange` to create a local browser `ObjectURL`. The photo is **never sent** to the `/api/v1/ml/vto/drape` backend endpoint. |
| VTO preview overlay | 🔴 HARDCODED | A static orange dashed rectangle is drawn at `top: 40%, left: 35%` with text "Generating Preview..." regardless of photo content. No AI inference runs. |
| Style Match results | 🔴 HARDCODED | "Excellent" and "Highly Recommended" are static strings (lines 527–531). No ML model is queried. |
| "Confirm & Add to Cart" button | 🔴 HARDCODED | Switches tab to `prevention`. No backend call. |

---

### 3. Your Cart / Prevention Tab
| Feature | Status | Details |
|---|---|---|
| Cart items (Hoodie M + Hoodie L) | 🔴 HARDCODED | Items are defined as a static `useState` array (lines 67–70). No cart API exists. |
| Sizing anomaly detection | 🟡 PARTIAL | The logic to detect "multiple sizes of the same item" (line 952) is **real JavaScript logic** running in the browser. It correctly checks `cartItems.filter(f => f.name === i.name).length > 1`. However, it does NOT call the backend `POST /api/v1/ml/friction/evaluate` endpoint. |
| Return velocity warning | 🟡 PARTIAL | The check `returnVelocity > 3` (line 957) is real JS logic, but the velocity number is a local `useState` variable (default: 4), not fetched from DynamoDB `ReturnsTable`. |
| "Refresh Checkout Risk" button | 🔴 HARDCODED | Only toggles the `showPreventionAlert` boolean. No backend call. |

---

### 4. Start a Return (Wizard) Tab
| Feature | Status | Details |
|---|---|---|
| Order ID / Product selection form | 🟡 PARTIAL | The form fields are local React state. The MSRP auto-updates based on product selection via a `useEffect` (lines 114–122), but this is hardcoded mapping, not a DynamoDB lookup. |
| Demo photo selection buttons | 🔴 HARDCODED | Clicking "Bose Headphones" / "iPhone 14" / "Essentials T-shirt" sets a static Unsplash URL. |
| File upload to S3 | 🟢 **LIVE** | `uploadFileToS3()` (lines 83–111) calls `GET /return/media-url` on the **real AWS API Gateway**, receives a **real S3 pre-signed URL**, and performs a **real binary PUT upload** to Amazon S3. Falls back to local `ObjectURL` if AWS is unreachable. |
| AI Visual Inspection (Bedrock) | 🟢 **LIVE** | `runTriageSimulation()` (lines 148–187) calls `POST /api/v1/ml/aws/inspect-condition` on the **local FastAPI server**, which invokes **Amazon Bedrock Nova Pro** for real AI damage grading. Returns live bounding boxes, grade, and summary. Falls back to hardcoded grades if ML server is offline. |
| Return Intercept API call | 🟢 **LIVE** | Lines 328–345 fire a real `POST /return/intercept` to the **AWS API Gateway**. The Go Lambda then: reads `OrdersTable` from DynamoDB, computes Geohash, runs margin triage, invokes Bedrock for premium items, writes to `ReturnsTable`, and calculates carbon metrics. |
| Console log timeline | 🟡 PARTIAL | The timeline messages ("Order Verified", "Inspection: Scanning...") are **hardcoded `setTimeout` strings** (lines 190–229) that appear on a timer regardless of backend response. However, if the ML server IS available, the grade and summary are injected from the live response (lines 210–212). |

---

### 5. Return Status / Result Tab
| Feature | Status | Details |
|---|---|---|
| Return Health Card (Grade, Pathway, Summary) | 🟡 PARTIAL | If the ML server was online during the wizard, these values are **live from Bedrock AI**. If not, they come from a detailed local fallback (lines 252–290) that varies by product and reason. |
| Bounding box SVG overlay | 🟡 PARTIAL | If the ML server returned live damage data, real bounding boxes from Bedrock are rendered. Otherwise, hardcoded coordinates are used (e.g., `crack at x:190, y:140`). |
| Proximity route map | 🔴 HARDCODED | The SVG route paths (lines 816–820) and node markers are static positioned elements. No Amazon Location Services API is called from the frontend. (Note: the Go backend DOES have Location API integration, but the frontend doesn't consume its response for rendering.) |
| Carbon impact card | 🔴 HARDCODED | CO₂ values (14 kg or 52.5 kg) are hardcoded ternary expressions (line 757). The Go backend calculates real carbon metrics and saves them to `CarbonTable` in DynamoDB, but the frontend never reads this response. |
| Account Standing | 🔴 HARDCODED | Always shows "✓ Excellent" (line 732). No trust score API (`/api/v1/ml/fraud/trust-score`) is called. |
| QR Code | 🔴 HARDCODED | A static SVG rectangle pattern (lines 740–749). Not a real QR encoding. |

---

### 6. Your Account Tab
| Feature | Status | Details |
|---|---|---|
| Account balance (₹1,240.50) | 🔴 HARDCODED | Static string (line 551). No wallet/balance API. |
| Prime Member badge | 🔴 HARDCODED | Static string (line 549). |
| Order/Return timeline | 🔴 HARDCODED | "Bose QuietComfort Headphones", "Return Initiated: Today, 10:42 AM" are all static text (lines 558–564). |
| Digital Product Passport (DPP) | 🔴 HARDCODED | "Origin: Factory A, Vietnam", "Purchased: Oct 12, 2026" are static strings (lines 576–578). The Go backend has a full `/dpp` endpoint with DynamoDB reads, but the frontend never calls it. |
| Climate Pledge Impact | 🔴 HARDCODED | "18.4 kg CO2" and "0.87 trees" are static text (lines 586–590). The backend calculates real values but frontend doesn't fetch them. |

---

## Seller Journey

### 7. Seller Central / Admin Dashboard Tab
| Feature | Status | Details |
|---|---|---|
| KPI metrics (Warehouse Avoidance 68.4%, Carbon 847.2 Kg, Capital ₹4.28M, Escrow ₹145,200) | 🔴 HARDCODED | All four metric values are static strings (lines 851–867). No `/metrics` or analytics API exists. |
| Listings table | 🟡 PARTIAL | The initial 4 listings (Bose, iPhone, Leather Jacket, Sony Controller) are hardcoded in `useState` (lines 59–64). However, when a buyer completes a return via the Wizard, a **new listing is dynamically injected** into this array from the triage result (lines 310–321). This is local React state, not a DynamoDB read. |
| "Transition State" button | 🟡 PARTIAL | The `toggleListingStatus()` function (lines 348–367) correctly implements the state machine logic (`available → reserved → sold`) with escrow recalculation. However, this only mutates local React state. It does NOT call the Go backend's `PUT /listing` endpoint, which would persist the transition to DynamoDB. |

---

## Summary Scorecard

| Category | 🟢 Live | 🟡 Partial | 🔴 Hardcoded |
|---|---|---|---|
| **Browse Catalog** | 0 | 0 | 4 |
| **Virtual Try-On** | 0 | 0 | 4 |
| **Cart / Prevention** | 0 | 2 | 2 |
| **Return Wizard** | 3 | 2 | 1 |
| **Return Status** | 0 | 2 | 4 |
| **Your Account** | 0 | 0 | 5 |
| **Seller Central** | 0 | 2 | 1 |
| **TOTAL** | **3** | **8** | **21** |

### Key Insight
Out of 32 distinct frontend features audited, only **3 are fully live end-to-end** (S3 upload, Bedrock AI inspection, and Return Intercept API). The Return Wizard is the strongest tab. Every other tab is primarily cosmetic with hardcoded data.
