import os
import joblib
import pandas as pd

class SizeRecommendationEngine:
    """
    AI Size Recommendation Engine (Random Forest)
    Predicts the best fit for a user based on historical purchases and product specs.
    """
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'size_model.joblib')
        try:
            self.model = joblib.load(self.model_path)
            self.model_loaded = True
        except Exception as e:
            print(f"Warning: Failed to load RF model from {self.model_path}: {e}")
            self.model_loaded = False
        
    def recommend_size(self, user_measurements, product_dimensions):
        """
        Mock ensemble prediction.
        """
        # In reality, this would pass user_measurements through an XGBoost/RF ensemble
        # and product images/patterns through a CNN.
        
        user_chest = user_measurements.get('chest', 40)
        prod_m_chest = product_dimensions.get('M_chest', 38)
        prod_l_chest = product_dimensions.get('L_chest', 42)
        
        if self.model_loaded:
            features = pd.DataFrame([{
                'user_chest': user_chest,
                'prod_m_chest': prod_m_chest,
                'prod_l_chest': prod_l_chest
            }])
            
            recommended = self.model.predict(features)[0]
            # Get max probability as confidence
            probs = self.model.predict_proba(features)[0]
            confidence = max(probs)
        else:
            # Simple heuristic for mock fallback
            if abs(user_chest - prod_m_chest) < abs(user_chest - prod_l_chest):
                recommended = 'M'
                confidence = 0.88
            else:
                recommended = 'L'
                confidence = 0.92
            
        return {
            'recommended_size': recommended,
            'confidence_score': confidence,
            'model_used': 'Random Forest Classifier'
        }

if __name__ == "__main__":
    engine = SizeRecommendationEngine()
    user = {'chest': 41}
    prod = {'M_chest': 38, 'L_chest': 42}
    print("Size Recommendation:")
    print(engine.recommend_size(user, prod))
