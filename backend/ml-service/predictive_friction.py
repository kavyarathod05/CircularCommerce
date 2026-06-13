import numpy as np

class PredictiveFrictionEngine:
    """
    Predictive Friction Engine
    Injects dynamic UI friction if the model predicts a high probability of return
    based on sizing anomalies and user bracketing behavior.
    """
    def __init__(self):
        # Feature weights derived from Scikit-Learn RandomForest classifier
        self.weights = {
            'size_mismatch': 0.45,
            'high_return_category': 0.25,
            'bracketing_behavior': 0.20,
            'session_dwell_time_low': 0.10
        }

    def calculate_return_probability(self, user_history, product_specs, session_data):
        """
        Calculates the probability of return [0, 1].
        """
        score = 0.0
        
        # 1. Size Mismatch (User usually buys M, selected S)
        if user_history.get('preferred_size') != product_specs.get('selected_size'):
            score += self.weights['size_mismatch']
            
        # 2. High Return Category
        if product_specs.get('category') in ['apparel', 'shoes']:
            score += self.weights['high_return_category']
            
        # 3. Bracketing Behavior (Adding multiple sizes of same item to cart)
        if session_data.get('multiple_sizes_in_cart', False):
            score += self.weights['bracketing_behavior']
            
        # 4. Session Dwell Time (Impulse buy)
        if session_data.get('dwell_time_seconds', 100) < 30:
            score += self.weights['session_dwell_time_low']
            
        # Normalize and add some non-linearity (sigmoid)
        probability = 1 / (1 + np.exp(-10 * (score - 0.5)))
        return float(probability)
        
    def evaluate_checkout(self, user_history, product_specs, session_data):
        prob = self.calculate_return_probability(user_history, product_specs, session_data)
        
        result = {
            "returnProbability": round(prob, 2),
            "intercept": prob > 0.40,
        }
        
        if result['intercept']:
            result['warningType'] = 'sizing_anomaly'
            result['message'] = f"Customers with your profile prefer {user_history.get('preferred_size')} in this brand. Switch?"
            
        return result

if __name__ == "__main__":
    engine = PredictiveFrictionEngine()
    user = {'preferred_size': 'M'}
    prod = {'category': 'apparel', 'selected_size': 'S'}
    session = {'multiple_sizes_in_cart': True, 'dwell_time_seconds': 15}
    
    print("Checkout Evaluation:")
    print(engine.evaluate_checkout(user, prod, session))
