# Hackathon Team Execution Checklist

This document breaks down the 5-Phase Execution Plan into parallel, full-stack tracks for **Kavya** and **Naman**. The workload is distributed gracefully so that both members contribute to the frontend UI and backend logic, avoiding bottlenecks. 

*   **Naman's Focus:** Core Infrastructure, Spatial/Matching Engine, Heavy ML Models (VTO, Vision, Pricing), and their associated complex UI components.
*   **Kavya's Focus:** Telemetry & Dashboards, Fraud/Friction Flows, Compliance & Sustainability logic, and the Core Return UX.

---

## Phase 1: Foundation & Core Workflows

### 💻 Naman
- [ ] **Infrastructure Setup:** Initialize Git monorepo and deploy base AWS infrastructure (CDK or SAM) for DynamoDB, API Gateway, and Lambda. (*Ref: `aws-samples/serverless-patterns`*)
- [ ] **Frontend Initialization:** Initialize React Native App and the base eCommerce UI shell. (*Ref: `vercel/commerce`, `shadcn-ui/ui`*)
- [ ] **Core Backend (Go):** Deploy the foundational Return Intercept Engine (AWS Lambda) and setup DynamoDB tables.
- [ ] **Device Security (Full-Stack):** Implement secure live-capture camera access on the frontend and the device fingerprinting hash verification on the backend.

### 🎨 Kavya
- [ ] **Return Flow (UI & API):** Build the Return Request flow wizard on the frontend (Media upload screens, reason selection) and wire it to the API Gateway.
- [ ] **Margin Triage Gateway (Backend):** Write the logic layer in the Lambda backend that evaluates the item's MSRP upon ingestion to branch the workflow (Premium vs. Commodity).
- [ ] **Basic Compliance (Full-Stack):** Build the baseline Scope-3 Carbon Tracker UI and write the basic distance math for initial Analytics logging. (*Ref: `thegreenwebfoundation/co2.js`*)

---

## Phase 2: Spatial Logistics & Matching

### 💻 Naman
- [ ] **Spatial Data Indexing:** Implement the DynamoDB Geo Library and translate user coordinates into 64-bit Geohashes.
- [ ] **Demand Engine:** Build the Local Demand Engine to execute radius queries (`$geoWithin`) and rank candidate buyers. (*Ref: `microsoft/recommenders`*)
- [ ] **Transit Routing:** Integrate Amazon Location Service (Route Matrix API) to calculate actual travel times and distances.

### 🎨 Kavya
- [ ] **ETA Optimization (UI):** Consume Naman's Route Matrix API data to visualize the optimal P2P route on the client. (*Ref: `mapbox/mapbox-gl-js`*)
- [ ] **Commodity Fallback (Full-Stack):** Build the backend logic to locate the nearest Amazon Locker (< 5km) and the corresponding frontend UI directing users to Lockers or notifying them of "Keep & Credit".
- [ ] **Location Clusters (UI):** Implement cluster maps for the admin logistics views. (*Ref: `Leaflet/Leaflet`*)

---

## Phase 3: Financials & Escrow

### 💻 Naman
- [ ] **Smart Escrow (Full-Stack):** Implement Smart Escrow backend logic to capture secondary buyer funds and build the payment checkout UI.
- [ ] **Listing State Machine:** Define backend state flows (available -> reserved -> sold) to release funds upon verified delivery. (*Ref: `sharetribe/sharetribe`*)

### 🎨 Kavya
- [ ] **Digital Product Passport (DPP):** Setup the DPP schema in DynamoDB to append ownership history, and display the DPP trail on the user dashboard.
- [ ] **Admin Telemetry Dashboard (UI):** Clone the UI template for the Judge's Admin Panel. Wire it to visualize live system metrics (Restocking Capital Recaptured, Active Intercept Efficiency). (*Ref: `tremorlabs/tremor`*)
- [ ] **Carbon Visualizers (UI):** Build the visual blocks representing trees planted and vehicle-distance equivalence. (*Ref: `climateiq/climateiq-frontend`*)

---

## Phase 4: Core AI Defect & Fraud Detection

### 💻 Naman
- [ ] **Damage Assessment (ML APIs):** Integrate Amazon Nova Pro via Bedrock for Condition Grading and map grades to standard taxonomies. (*Ref: `openai/openai-cookbook`, `eBay/ebay-sdk-python`*)
- [ ] **Product Verification (ML APIs):** Set up Bedrock Knowledge Bases (Nova Embeddings) for Cross-Modal Swapped Goods detection.
- [ ] **Deepfake Detection (ML APIs):** Utilize Rekognition to check uploaded media for GAN Artifacts and pixel tampering.

### 🎨 Kavya
- [ ] **Liveness Check (Full-Stack):** Build the Liveness Check camera recording UI wrapper and integrate the Amazon Rekognition Face Liveness backend calls.
- [ ] **Bounding Boxes (UI):** Extract defect coordinates from Naman's Nova Pro API response and draw bounding boxes on the frontend images using HTML5 Canvas. (*Ref: `ultralytics/ultralytics`*)
- [ ] **Verification UI:** Build the "Inspection Results" summary card to display the AI findings to the user.

---

## Phase 5: Generative, Predictive & Advanced ML

### 💻 Naman
- [ ] **VTO Engine (Full-Stack):** Implement the Virtual Try-On (VTO) backend module (diffusion models/GANs) AND build the frontend component for users to upload their photo and view the result.
- [ ] **Dynamic Pricing (ML APIs):** Deploy the GenAI Dynamic Pricing engine to execute demand-aware discounts.
- [ ] **Network Fraud (ML APIs):** Implement Heterogeneous GNNs (SEFraud) to detect multi-accounting and calculate Trust Scores.

### 🎨 Kavya
- [ ] **Size Recommendation (Full-Stack):** Deploy the AI Size Recommendation model (RF, KNN, CNN, XGBoost) endpoint and build the sizing UI component.
- [ ] **Predictive Friction (Full-Stack):** Set up the backend to serve predictive return probability scores. Build the frontend listener to monitor session dwell time, injecting the dynamic "Size Match" modal to pause checkout if flagged. (*Ref: `GiorgiModebadze/Customer-returns-prediction`, `gurbaaz27/amazon-hackathon`*)
- [ ] **Final Polish:** Ensure all mobile responsiveness is perfect and the end-to-end demo flow runs seamlessly across both of your features.
