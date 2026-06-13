# Hackathon Team Execution Checklist

> [!IMPORTANT]
> **Frontend Aesthetic Mandate:** Naman (and Kavya where applicable) MUST strictly follow the principles outlined in `docs/03_features_and_modules/04_frontend_aesthetic_manifesto.md`. No generic templates, no overused fonts (Arial/Inter), and no AI-default color palettes. Every UI component must be bold, opinionated, and visually distinctive.

This document breaks down the 5-Phase Execution Plan into parallel tracks for **Kavya** and **Naman**, strictly divided by domain expertise.

*   **Kavya's Focus (AWS & Infrastructure):** All AWS services (Lambda, DynamoDB, API Gateway, Location Service), the core Go routing backend, data persistence, and foundational infrastructure.
*   **Naman's Focus (Machine Learning & AI):** All AI/ML models (Amazon Bedrock, Nova Pro, Rekognition, VTO Models, Predictive Friction, Dynamic Pricing, GNNs) and integrating these ML outputs into the client UI.

---

## Phase 1: Foundation & Core Workflows

### ☁️ Kavya (AWS & Core Backend)
- [x] **Infrastructure Setup:** Deploy base AWS infrastructure (CDK or SAM) for DynamoDB, API Gateway, and Lambda. (*Ref: `aws-samples/serverless-patterns`*)
- [x] **Core Backend (Go):** Deploy the foundational Return Intercept Engine (AWS Lambda) and setup DynamoDB tables (Listings, Orders, Returns, Matches).
- [x] **Margin Triage Gateway:** Write the AWS Lambda logic evaluating the item's MSRP to branch the workflow (Premium vs. Commodity).
- [x] **Return Flow (Backend):** Wire the API Gateway to handle Media uploads and device hash ingestion.
- [x] **Basic Compliance:** Setup the AWS data pipelines for the Scope-3 Carbon Tracker logging.

### 🧠 Naman (Frontend & Pre-ML Setup)
- [ ] **Frontend Initialization:** Initialize React Native App. **AESTHETIC MANDATE:** Implement a custom, bold type scale and distinctive 4-hex color palette. Do NOT use generic shadcn defaults; strip the styling and apply the custom manifesto design system.
- [ ] **Return Flow (UI):** Build the Return Request flow wizard on the frontend (Media upload screens).
- [ ] **Device Security (Client):** Implement secure live-capture camera access on the mobile device for later Liveness verification.

---

## Phase 2: Spatial Logistics & Matching

### ☁️ Kavya (AWS Spatial & Routing)
- [x] **Spatial Data Indexing:** Implement the DynamoDB Geo Library. (Geohash coordinates indexing complete)
- [x] **Geohash Integration:** Translate user coordinates into 64-bit Geohashes and store them in a DynamoDB Local Secondary Index.
- [x] **Transit Routing:** Integrate **Amazon Location Service** (Route Matrix API) via Lambda to calculate actual travel times and distances.
- [x] **Commodity Fallback:** Build the backend queries to locate the nearest Amazon Locker (< 5km) or trigger "Keep & Credit".

### 🧠 Naman (Algorithmic Demand & UI)
- [ ] **Demand Engine:** Build the Local Demand Engine algorithms to rank candidate buyers based on content collaborative filtering. (*Ref: `microsoft/recommenders`*)
- [ ] **ETA Optimization (UI):** Consume Kavya's Route Matrix API data to visualize the optimal P2P route on the client. (*Ref: `mapbox/mapbox-gl-js`*)
- [ ] **Location Clusters (UI):** Implement cluster maps for the admin logistics views. (*Ref: `Leaflet/Leaflet`*)

---

## Phase 3: Financials & Escrow

### ☁️ Kavya (AWS State Management)
- [ ] **Smart Escrow (Backend):** Implement the core escrow tracking logic and payment webhooks via AWS Lambda.
- [ ] **Listing State Machine:** Define backend state flows (available -> reserved -> sold) in DynamoDB. (*Ref: `sharetribe/sharetribe`*)
- [ ] **Digital Product Passport (DPP):** Setup the DPP schema in DynamoDB to append ownership history.

### 🧠 Naman (Telemetry & ML Dashboards)
- [ ] **Admin Telemetry Dashboard:** Clone the UI template for the Judge's Admin Panel. Wire it to visualize live system metrics (Restocking Capital Recaptured). (*Ref: `tremorlabs/tremor`*)
- [ ] **Carbon Visualizers:** Build the visual blocks representing trees planted and vehicle-distance equivalence. (*Ref: `climateiq/climateiq-frontend`*)

---

## Phase 4: Core AI Defect & Fraud Detection

### ☁️ Kavya (AWS Integrations)
- [ ] **Verification Routing:** Update the AWS Lambda orchestrator to route images to Naman's ML endpoints and store the final AI grades in DynamoDB.
- [ ] **Verification UI:** Build the basic "Inspection Results" summary card to display the AI findings.

### 🧠 Naman (Heavy ML Integrations)
- [ ] **Damage Assessment:** Integrate **Amazon Bedrock (Nova Pro)** for Condition Grading and map grades to standard taxonomies.
- [ ] **Product Verification:** Set up **Bedrock Knowledge Bases (Nova Embeddings)** for Cross-Modal Swapped Goods detection.
- [ ] **Liveness Check:** Integrate **Amazon Rekognition Face Liveness** API calls.
- [ ] **Deepfake Detection:** Utilize **Amazon Rekognition** to check uploaded media for GAN Artifacts and pixel tampering.
- [ ] **Bounding Boxes (UI):** Extract defect coordinates from the Nova Pro API response and draw bounding boxes on the frontend images using HTML5 Canvas. (*Ref: `ultralytics/ultralytics`*)

---

## Phase 5: Generative, Predictive & Advanced ML

### ☁️ Kavya (Final AWS Polish)
- [ ] **End-to-End Orchestration:** Ensure all Step Functions and AWS Lambda triggers flow sequentially without failure.
- [ ] **Final Polish:** Ensure all mobile responsiveness is perfect and the end-to-end demo flow runs seamlessly.

### 🧠 Naman (Advanced ML Models)
- [ ] **VTO Engine (Full-Stack):** Implement the VTO backend and build the frontend component. **AESTHETIC MANDATE:** The VTO interface must be the 'Signature Element' of the app—use orchestrated CSS motion and an editorial layout, avoiding standard file-upload boxes.
- [ ] **Size Recommendation (ML):** Deploy the AI Size Recommendation model (RF, KNN, CNN, XGBoost).
- [ ] **Predictive Friction (ML):** Generate predictive return probability scores. Build the frontend listener to monitor session dwell time and inject the dynamic "Size Match" modal. (*Ref: `GiorgiModebadze/Customer-returns-prediction`*)
- [ ] **Dynamic Pricing (ML):** Deploy the GenAI Dynamic Pricing engine to execute demand-aware discounts.
- [ ] **Network Fraud (ML):** Implement Heterogeneous GNNs (SEFraud) to detect multi-accounting and calculate Trust Scores.
