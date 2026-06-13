# ML Model Upgrade Checklist

This checklist outlines the exact steps required to upgrade your current Python microservice from "Heuristics & Simulators" to "True Trained Machine Learning Models" as outlined in your architecture design.

## 1. Predictive Checkout Friction Engine (`predictive_friction.py`)
**Goal:** Replace hardcoded heuristic weights with a trained `XGBoost` classifier (or proven open-source tabular weights).
- `[x]` **Add Dependency:** Add `xgboost` and `scikit-learn` to `requirements.txt`.
- `[x]` **FAST UPGRADE (Open-Source Option):** Instead of training from scratch, visit the `GiorgiModebadze/Customer-returns-prediction` repository. Scrape their pre-calculated tabular return risk coefficients and swap them directly into your python dictionary.
- `[x]` **Create Dataset:** (If training from scratch) Generate a synthetic CSV dataset containing `historical_returns`, `dwell_time_seconds`, `multiple_sizes_in_cart`, `original_price`, and a binary target `returned_item` (0 or 1).
- `[x]` **Train Model:** Write a script (`train_friction_model.py`) to train an `xgb.XGBClassifier` on the CSV and save the output as `friction_model.json`.
- `[x]` **Refactor Engine:** Update `predictive_friction.py` to load `friction_model.json` and call `model.predict_proba(features)`.

## 2. Size Recommendation Engine (`size_recommendation.py`)
**Goal:** Replace the `if/else` stub with a trained Random Forest model.
- `[x]` **Create Dataset:** Generate a synthetic CSV mapping user measurements (`chest`, `waist`) and product specs (`M_chest`, `L_chest`) to the target `optimal_size`.
- `[x]` **Train Model:** Write a script (`train_size_model.py`) using `sklearn.ensemble.RandomForestClassifier` to train on the data and export it via `joblib`.
- `[x]` **Refactor Engine:** Update `size_recommendation.py` to load the `joblib` file and return `model.predict()` and `model.predict_proba()`.

## 3. Smart Routing Engine (Go Backend / `main.go`)
**Goal:** Replace the `if grade == "C" then recycle` logic with an XGBoost Regression model.
- `[x]` **Train Model:** Train a lightweight regression model that predicts net margin based on (Repair Cost, Depreciation, AI Grade, Distance). Export to ONNX format.
- `[x]` **Integrate ONNX in Go:** Add an ONNX runtime library to the Go Serverless API (`main.go`).
- `[x]` **Refactor Go Routing:** Load the ONNX model in Go and pass the Bedrock AI Grade and Location Services distance to predict the most profitable route dynamically.

## 4. Local Demand Engine (`demand_engine.py`)
**Goal:** Upgrade the basic cosine similarity matching to robust, industry-standard Content Collaborative Filtering.
- `[x]` **Review Open-Source:** Review the `microsoft/recommenders` GitHub repository.
- `[x]` **Port Schemas:** Port their proven content-scoring schemas into your Python engine.
- `[x]` **Refactor Engine:** Update the `demand_engine.py` to apply these advanced collaborative filtering formulas when querying wishlist affinities from DynamoDB, rather than relying on pure linear vector distances.
