# ML Model Upgrade Checklist

This checklist outlines the exact steps required to upgrade your current Python microservice from "Heuristics & Simulators" to "True Trained Machine Learning Models" as outlined in your architecture design.

## 1. Predictive Checkout Friction Engine (`predictive_friction.py`)
**Goal:** Replace hardcoded weights with a trained `XGBoost` classifier.
- `[ ]` **Add Dependency:** Add `xgboost` and `scikit-learn` to `requirements.txt`.
- `[ ]` **Create Dataset:** Generate a synthetic CSV dataset containing `historical_returns`, `dwell_time_seconds`, `multiple_sizes_in_cart`, `original_price`, and a binary target `returned_item` (0 or 1).
- `[ ]` **Train Model:** Write a script (`train_friction_model.py`) to train an `xgb.XGBClassifier` on the CSV and save the output as `friction_model.json`.
- `[ ]` **Refactor Engine:** Update `predictive_friction.py` to load `friction_model.json` and call `model.predict_proba(features)` instead of using the math formula.

## 2. Size Recommendation Engine (`size_recommendation.py`)
**Goal:** Replace the `if/else` stub with a trained Random Forest model.
- `[ ]` **Create Dataset:** Generate a synthetic CSV mapping user measurements (`chest`, `waist`) and product specs (`M_chest`, `L_chest`) to the target `optimal_size`.
- `[ ]` **Train Model:** Write a script (`train_size_model.py`) using `sklearn.ensemble.RandomForestClassifier` to train on the data and export it via `joblib`.
- `[ ]` **Refactor Engine:** Update `size_recommendation.py` to load the `joblib` file and return `model.predict()` and `model.predict_proba()`.

## 3. Smart Routing Engine (Go Backend / `main.go`)
**Goal:** Replace the `if grade == "C" then recycle` logic with an XGBoost Regression model.
- `[ ]` **Train Model:** Train a lightweight regression model that predicts net margin based on (Repair Cost, Depreciation, AI Grade, Distance). Export to ONNX format.
- `[ ]` **Integrate ONNX in Go:** Add an ONNX runtime library to the Go Serverless API (`main.go`).
- `[ ]` **Refactor Go Routing:** Load the ONNX model in Go and pass the Bedrock AI Grade and Location Services distance to predict the most profitable route dynamically.
