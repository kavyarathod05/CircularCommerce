# Machine Learning Models Review

This document provides a comprehensive technical review of all AI/ML models present in the `backend/ml-service` microservice. It details the algorithms used, the purpose of each engine, and whether the model uses learned weights (trained) or static algorithmic logic.

---

## 1. SEFraud Trust Scoring (`network_fraud.py`)
- **Purpose:** Detects multi-accounting and calculates trust scores to prevent return fraud.
- **Algorithm Used:** Graph Theory & Network Analysis (via `networkx`).
- **Is it Trained?:** **NO (Algorithmic Heuristic)**
  - This is an untrained, memory-based model. It dynamically builds a live Heterogeneous Graph using users, IP addresses, and Device IDs as nodes. It penalizes users based on structural proximity to low-trust nodes (2-hop neighbors) rather than using backpropagation or learned gradient weights.

## 2. Hyperlocal Demand Engine (`demand_engine.py`)
- **Purpose:** Ranks nearby buyers to find the best match for a returned product based on their historical affinities.
- **Algorithm Used:** Content-Based Collaborative Filtering & Cosine Vector Similarity (via `scikit-learn`).
- **Is it Trained?:** **NO (Memory-Based)**
  - It does not undergo a training phase. It creates vectors for the product (`[is_electronics, is_apparel]`) and the buyer's affinities (`[elec_aff, app_aff]`) on the fly, calculating the cosine distance between them using live DynamoDB data.

## 3. Predictive Checkout Friction (`predictive_friction.py`)
- **Purpose:** Evaluates a user's shopping cart session to predict the probability of a return (e.g., detecting "bracketing" behavior where a user buys multiple sizes).
- **Algorithm Used:** Weighted Linear Combination with Sigmoid Normalization.
- **Is it Trained?:** **NO (Expert Weights)**
  - Instead of learning weights from a historical dataset (like a Logistic Regression model would), the weights are hardcoded "expert heuristics" (e.g., `size_mismatch: 0.45`, `bracketing_behavior: 0.20`). It uses a Sigmoid function `1 / (1 + exp(-10 * (score - 0.5)))` to mathematically squash the final score into a `[0, 1]` probability curve.

## 4. Visual Triage & Liveness (`aws_ai_integrations.py`)
- **Purpose:** Analyzes product photos for scratches/cracks and verifies human liveness.
- **Algorithm Used:** Large Multimodal Models (LMM) and Deep CNNs via AWS APIs.
- **Is it Trained?:** **PRE-TRAINED (by AWS)**
  - The local service acts as a secure wrapper. The heavy lifting is done by Amazon Bedrock (using the foundational **Nova Pro** model) and Amazon Rekognition. No local fine-tuning or training is required.

## 5. Virtual Try-On Engine (`vto_engine.py`)
- **Purpose:** Drapes clothing over user-provided photos to show fit and prevent sizing returns.
- **Algorithm Used:** Diffusion Models / Generative Adversarial Networks (GAN).
- **Is it Trained?:** **N/A (Relies on Cloud Endpoint)**
  - The engine does not contain local model weights. It is wired to invoke an external Amazon SageMaker endpoint (`vto-diffusion-gan-endpoint`). The actual training of the Diffusion-GAN would happen out-of-band in AWS.

## 6. GenAI Dynamic Pricing (`dynamic_pricing.py`)
- **Purpose:** Decays the price of a listed item based on market demand and time to ensure liquidity.
- **Algorithm Used:** Deterministic Decay Formula.
- **Is it Trained?:** **NO (Algorithmic)**
  - Despite the "GenAI" naming convention in the architecture, the actual code implementation is a strict mathematical formula that applies linear discounts (e.g., +2% discount every 24 hours).

## 7. Size Recommendation Engine (`size_recommendation.py`)
- **Purpose:** Recommends the optimal clothing size based on user measurements.
- **Algorithm Used:** Claims to be an Ensemble (XGBoost, Random Forest, CNN).
- **Is it Trained?:** **NO (Pure Simulator Stub)**
  - This module is currently a hollow stub. It does not import any ML libraries (like `xgboost` or `sklearn`) and simply uses an `if/else` statement to return a simulated response.

---

### Conclusion for Next Steps:
If the goal is to present these as "True ML," the primary areas to upgrade from **Heuristics to Trained Models** are:
1. Swapping the hardcoded weights in `predictive_friction.py` for a trained `XGBClassifier` using `scikit-learn` or `xgboost`.
2. Actually implementing the Random Forest in `size_recommendation.py`.
3. Deploying the SageMaker endpoint for the VTO Engine.

---

## Gap Analysis: Proposed Architecture vs. Actual Implementation

Based on the proposed robust architecture roadmap, here is the reality of what is currently implemented in the codebase versus what is still missing:

### 1. Pre-Checkout Return Prevention Module
*   **Proposed:** Random Forest, KNN, CNN for sizing. XGBoost for Return Probability Score.
*   **Actual State (Missing/Heuristic):** The `size_recommendation.py` file is currently a pure simulator stub with no RF/KNN logic. The `predictive_friction.py` calculates a Return Probability Score, but it uses hardcoded heuristic weights passed through a Sigmoid function rather than a trained XGBoost model.

### 2. AI Product Inspection Module
*   **Proposed:** Bounded-compute VLMs (SmolVLM2) and Multi-Task Learning (MTL/ResNet) for localization and grading.
*   **Actual State (Alternate Implementation):** We do not have local ResNet or SmolVLM2 running. Instead, we are securely outsourcing this exact workload to AWS using **Amazon Bedrock (Nova Pro)**. The result is the same (bounding boxes + JSON rationale), but the technology stack is Cloud-LMM rather than local MTL.

### 3. Anti-Fraud & Multi-Accounting Detection
*   **Proposed:** Heterogeneous Graph Neural Networks (SEFraud) and Device Fingerprinting AI.
*   **Actual State (Partially Implemented):** Device fingerprints are being generated by the client and passed to the backend. The backend (`network_fraud.py`) successfully uses Graph Theory (`networkx`) to map overlapping nodes and penalize 2-hop neighbors. However, it is a deterministic graph algorithm, not a trained Graph Transformer Network.

### 4. Camera Injection & Spoofing Prevention
*   **Proposed:** Virtual Camera Detection (VCD), GAN Artifact Analysis, and Passive Liveness Detection.
*   **Actual State (Partially Implemented):** The Naman ML microservice successfully integrates **Amazon Rekognition** to handle the Passive Liveness Detection. However, local VCD models and pixel-level GAN artifact detectors are not implemented in the Python backend.

### 5. Smart Routing Engine
*   **Proposed:** Generalized Boosting Regression (XGBoost) to weigh depreciation, repair, and demand.
*   **Actual State (Missing):** The routing logic is currently handled by the Go Serverless API (`main.go`). It uses deterministic `if/else` logic (e.g., checking if an AI grade is below a threshold to route to recycling) combined with Amazon Location Services. There is no XGBoost regression model running this optimization.
