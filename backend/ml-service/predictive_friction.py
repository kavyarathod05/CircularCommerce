import numpy as np
import boto3
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
        
        self.weights = {
            'size_mismatch': 0.45,
            'high_return_category': 0.25,
            'bracketing_behavior': 0.20,
            'session_dwell_time_low': 0.10,
            'high_value_item': 0.30,
            'frequent_returner': 0.40
        }

    def evaluate_checkout(self, user_id, product_id, session_data):
        """
        Calculates the probability of return [0, 1] using live DynamoDB data.
        """
        score = 0.0
        
        # 1. Frequent Returner (DynamoDB Query on ReturnsTable UserId-index)
        try:
            response = self.returns_table.query(
                IndexName='UserId-index',
                KeyConditionExpression=Key('UserId').eq(user_id)
            )
            return_count = len(response.get('Items', []))
            if return_count > 3:
                score += self.weights['frequent_returner']
        except Exception as e:
            print(f"Warning: Failed to query ReturnsTable: {e}")
            
        # 2. High Value Item (DynamoDB Scan on OrdersTable for OriginalPrice)
        # Assuming we need to find the product's price (could also be in ListingsTable)
        try:
            order_res = self.orders_table.scan(
                FilterExpression=Attr('ProductId').eq(product_id)
            )
            items = order_res.get('Items', [])
            if items:
                original_price = float(items[0].get('OriginalPrice', 0))
                if original_price > 5000:
                    score += self.weights['high_value_item']
        except Exception as e:
            print(f"Warning: Failed to query OrdersTable: {e}")
            
        # 3. Bracketing Behavior (Adding multiple sizes of same item to cart)
        if session_data.get('multiple_sizes_in_cart', False):
            score += self.weights['bracketing_behavior']
            
        # 4. Session Dwell Time (Impulse buy)
        if session_data.get('dwell_time_seconds', 100) < 30:
            score += self.weights['session_dwell_time_low']
            
        # Normalize and add some non-linearity (sigmoid)
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
