import numpy as np
import boto3
try:
    import xgboost as xgb
    _HAS_XGB = True
except Exception:
    xgb = None
    _HAS_XGB = False
import os
import pandas as pd
from boto3.dynamodb.conditions import Key, Attr

class PredictiveFrictionEngine:
    def __init__(self, region_name='us-east-1'):
        self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
        self.returns_table = self.dynamodb.Table('ReturnsTable')
        self.orders_table = self.dynamodb.Table('OrdersTable')
        self.model_path = os.path.join(os.path.dirname(__file__), 'friction_model.json')
        self.model = None
        self.model_loaded = False
        if _HAS_XGB:
            try:
                self.model = xgb.XGBClassifier()
                self.model.load_model(self.model_path)
                self.model_loaded = False
            except Exception as e:
                print(f"Warning: Failed to load XGBoost model from {self.model_path}: {e}")

    def _detect_bracketing(self, session_data):
        if session_data.get('multiple_sizes_in_cart'):
            return True
        items = session_data.get('cart_items') or []
        by_name = {}
        for item in items:
            name = (item.get('name') or item.get('product_id') or 'item').lower()
            size = (item.get('size') or 'one').lower()
            by_name.setdefault(name, set()).add(size)
        return any(len(sizes) > 1 for sizes in by_name.values())

    def evaluate_checkout(self, user_id, product_id, session_data):
        return_count = 0
        original_price = 0.0

        try:
            response = self.returns_table.query(
                IndexName='UserId-index',
                KeyConditionExpression=Key('UserId').eq(user_id)
            )
            return_count = len(response.get('Items', []))
        except Exception as e:
            print(f"Warning: Failed to query ReturnsTable: {e}")

        try:
            order_res = self.orders_table.scan(
                FilterExpression=Attr('ProductId').eq(product_id)
            )
            items = order_res.get('Items', [])
            if items:
                original_price = float(items[0].get('OriginalPrice', 0))
        except Exception as e:
            print(f"Warning: Failed to query OrdersTable: {e}")

        multiple_sizes_in_cart = self._detect_bracketing(session_data)
        dwell_time_seconds = session_data.get('dwell_time_seconds', 100)

        if 'return_velocity' in session_data:
            return_count = int(session_data['return_velocity'])

        if original_price == 0.0:
            pid_lower = product_id.lower()
            if 'iphone' in pid_lower or 'bose' in pid_lower or 'ipad' in pid_lower:
                original_price = 85000
            elif 'hoodie' in pid_lower or 'jacket' in pid_lower:
                original_price = 3000
            else:
                original_price = 1000

        reasons = []
        if self.model_loaded:
            features = pd.DataFrame([{
                'historical_returns': return_count,
                'dwell_time_seconds': dwell_time_seconds,
                'multiple_sizes_in_cart': 1 if multiple_sizes_in_cart else 0,
                'original_price': original_price
            }])
            probs = self.model.predict_proba(features)
            prob = float(probs[0][1])
        else:
            prob = 0.08
            if multiple_sizes_in_cart:
                prob += 0.34
                reasons.append('Multiple sizes of the same item in cart')
            if return_count >= 4:
                prob += 0.28
                reasons.append('High recent return activity on account')
            elif return_count >= 2:
                prob += 0.12
                reasons.append('Elevated return activity on account')
            if original_price > 5000:
                prob += 0.10
                reasons.append('High-value item')
            if dwell_time_seconds < 30:
                prob += 0.08
                reasons.append('Very quick checkout decision')
            prob = min(0.95, max(0.05, prob))

        fit_confidence = round(max(0.05, 1 - prob), 2)
        return_risk_percent = round(prob * 100)

        result = {
            "returnProbability": round(prob, 2),
            "returnRiskPercent": return_risk_percent,
            "fitConfidencePercent": round(fit_confidence * 100),
            "intercept": prob > 0.45,
            "reasons": reasons if not self.model_loaded else [],
        }

        if result['intercept']:
            result['warningType'] = 'high_return_risk'
            result['message'] = (
                "Ordering multiple sizes or returning frequently increases the chance this order comes back. "
                "Try one size or use Try Before You Buy."
            )
        else:
            result['message'] = "Sizing and account history look good for this cart."

        return result
