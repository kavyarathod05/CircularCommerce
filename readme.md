# SecondLife Commerce

SecondLife Commerce is a next-generation, AWS-powered reverse commerce platform that automates returns grading and intercept routing. It aims to eliminate reverse logistics waste by matching returned items directly to local buyers or drop nodes, bypassing central warehouses.

---

## 📂 Project Directory Structure

Here is a map of the repository's component-based structure:

```text
├── backend/                # Unified Backend Services
│   ├── serverless-api/     # Go AWS SAM REST API backend (Lambda & API Gateway)
│   │   ├── return-intercept/ # Lambda handler for returns interception (main.go)
│   │   ├── template.yaml   # AWS SAM infrastructure template (API Gateway, Lambda, CORS)
│   │   └── Makefile        # Backend build & packaging script
│   │
│   └── ml-service/         # FastAPI Machine Learning Service
│       ├── main.py         # FastAPI entrypoint & endpoint routing
│       ├── aws_ai_integrations.py # Real Bedrock (Nova Pro) & Rekognition API integrations
│       ├── demand_engine.py # Local Demand Engine Algorithm
│       ├── dynamic_pricing.py # GenAI Dynamic Pricing Engine
│       ├── network_fraud.py # SEFraud GNN (Graph Neural Network) Trust Scoring
│       ├── predictive_friction.py # Return Probability & Friction Evaluation
│       ├── size_recommendation.py # Size Recommendation Algorithm
│       ├── vto_engine.py   # Virtual Try-On (VTO) Simulation Engine
│       └── requirements.txt # Python dependencies
│
├── frontend/               # Consolidated Frontend Applications
│   ├── src/                # React Native (Expo) Mobile App source code
│   │   ├── screens/        # Screens (AdminDashboard, VTOScreen, Returns, etc.)
│   │   └── components/     # UI Components (ClusterMap, RouteMatrixMap)
│   └── web/                # React Web App (Vite + TS + Tailwind)
│       ├── src/            # Web application source code (App.tsx, main.tsx)
│       └── vite.config.ts  # Vite configuration
│
├── docs/                   # Structured Project Documentation & Strategy
│   ├── README.md           # Documentation Index & Blueprint Guide
│   ├── CONTEXT.md          # Hackathon problem statement & rules
│   ├── SecondLifeCommerce_ProblemResearch.docx # Generated docx report
│   └── second.js           # Docx report generator script
│
├── tests/                  # Integration Test Suites
│   └── test_all_components.py # Python integration test suite (AWS & ML)
```

---

## 🚀 Quick Start & Orchestration

Detailed guides for executing each layer can be found inside the documentation. Here are the quick start commands:

### 1. Run the Frontend (Web & Mobile)
* **React Web App:**
  ```bash
  cd frontend/web
  npm install
  npm run dev
  ```
* **Expo Mobile App:**
  ```bash
  cd frontend
  npm install
  npx expo start
  ```

### 2. Run the ML FastAPI Server
```bash
cd backend/ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Run Integration Tests
Verify the connection between local components and live AWS APIs:
```bash
python tests/test_all_components.py
```

---

## 📂 Project Documentation

All system design blueprints, implementation strategies, API payloads, and database structures are fully modularized and organized.

Please explore the comprehensive documentation here:
* **[Documentation Index](file:///g:/amazon/hackon_amazon/docs/README.md)** (Start here)
* **[AWS System Architecture](file:///g:/amazon/hackon_amazon/docs/02_architecture_and_design/01_aws_architecture.md)**
* **[Go Backend Services & APIs](file:///g:/amazon/hackon_amazon/docs/02_architecture_and_design/02_backend_services.md)**
* **[AI Design & Core Algorithms](file:///g:/amazon/hackon_amazon/docs/02_architecture_and_design/04_ai_and_algorithms.md)**
* **[Algorithmic Triage Routing Engine](file:///g:/amazon/hackon_amazon/docs/03_features_and_modules/02_triage_routing_engine.md)**
* **[AWS Infrastructure Deployment & Orchestration Guide](file:///g:/amazon/hackon_amazon/docs/04_hackathon_and_execution/05_orchestration_guide.md)**

---

## 🛠️ Stack Summary
* **Frontend**: React · React Native · Expo · Vite · TypeScript · Tailwind CSS
* **Backend**: Go microservices · AWS Lambda (SAM)
* **Database**: Amazon DynamoDB · Amazon OpenSearch
* **AI/ML**: Amazon Bedrock (Nova Pro / Claude 3.5 Sonnet) · Amazon Rekognition
* **Messaging & Event Routing**: Amazon EventBridge · AWS Step Functions · SQS · SNS