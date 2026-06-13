import numpy as np
import boto3
import xgboost as xgb
import os
import pandas as pd
from boto3.dynamodb.conditions import Key, Attr

class PredictiveFrictionEngine:
    """
    Predictive Friction Engine
    Injects dynamic UI friction if the model predicts a high probability of return
    based on sizing anomalies, bracketing behavior, and historical DynamoDB return data.
    """
    def __init__(self, region_name='us-east-1'):
        self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
        self.returns_table = self.dynamodb.Table('ReturnsTable')
        self.orders_table = self.dynamodb.Table('OrdersTable')
        
        self.model_path = os.path.join(os.path.dirname(__file__), 'friction_model.json')
        self.model = xgb.XGBClassifier()
        try:
            self.model.load_model(self.model_path)
            self.model_loaded = True
        except Exception as e:
            print(f"Warning: Failed to load XGBoost model from {self.model_path}: {e}")
            self.model_loaded = False

    def evaluate_checkout(self, user_id, product_id, session_data):
        """
        Calculates the probability of return [0, 1] using live DynamoDB data.
        """
        return_count = 0
        original_price = 0.0

        # 1. Frequent Returner (DynamoDB Query on ReturnsTable UserId-index)
        try:
            response = self.returns_table.query(
                IndexName='UserId-index',
                KeyConditionExpression=Key('UserId').eq(user_id)
            )
            return_count = len(response.get('Items', []))
        except Exception as e:
            print(f"Warning: Failed to query ReturnsTable: {e}")
            
        # 2. High Value Item (DynamoDB Scan on OrdersTable for OriginalPrice)
        try:
            order_res = self.orders_table.scan(
                FilterExpression=Attr('ProductId').eq(product_id)
            )
            items = order_res.get('Items', [])
            if items:
                original_price = float(items[0].get('OriginalPrice', 0))
        except Exception as e:
            print(f"Warning: Failed to query OrdersTable: {e}")
            
        # 3. Bracketing Behavior
        multiple_sizes_in_cart = 1 if session_data.get('multiple_sizes_in_cart', False) else 0
            
        # 4. Session Dwell Time
        dwell_time_seconds = session_data.get('dwell_time_seconds', 100)
            
        if self.model_loaded:
            # Create input array matching training features: 
            # ['historical_returns', 'dwell_time_seconds', 'multiple_sizes_in_cart', 'original_price']
            features = pd.DataFrame([{
                'historical_returns': return_count,
                'dwell_time_seconds': dwell_time_seconds,
                'multiple_sizes_in_cart': multiple_sizes_in_cart,
                'original_price': original_price
            }])
            
            # Predict probability of class 1 (returned)
            probs = self.model.predict_proba(features)
            prob = float(probs[0][1])
        else:
            # Fallback heuristic if model is missing
            score = 0.0
            if return_count > 3: score += 0.40
            if original_price > 5000: score += 0.30
            if multiple_sizes_in_cart: score += 0.20
            if dwell_time_seconds < 30: score += 0.10
            
            probability = 1 / (1 + np.exp(-10 * (score - 0.5)))
            prob = float(probability)
        
        result = {
            "returnProbability": round(prob, 2),
            "intercept": prob > 0.40,
        }
        
        if result['intercept']:
            result['warningType'] = 'high_return_risk'
            result['message'] = "This item has a high return risk based on your profile and item characteristics. Are you sure?"
            
        return result

if __name__ == "__main__":
    engine = PredictiveFrictionEngine()
    session = {'multiple_sizes_in_cart': True, 'dwell_time_seconds': 15}
    print("Checkout Evaluation:")
    print(engine.evaluate_checkout('usr-1', 'p-smartphone', session))
