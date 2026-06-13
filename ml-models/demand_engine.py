import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

class DemandEngine:
    """
    Local Demand Engine Algorithm
    Ranks candidate buyers based on Content Collaborative Filtering.
    """
    def __init__(self):
        # Mock dataset of buyers and their features (category affinity, price threshold, recency score)
        self.buyer_features = pd.DataFrame({
            'buyer_id': ['B001', 'B002', 'B003', 'B004'],
            'electronics_affinity': [0.9, 0.2, 0.8, 0.4],
            'apparel_affinity': [0.1, 0.9, 0.3, 0.8],
            'price_threshold': [2000, 500, 1500, 800],
            'recency_score': [0.8, 0.5, 0.9, 0.3]
        }).set_index('buyer_id')

    def rank_buyers(self, product_category, product_price, candidate_ids):
        """
        Rank buyers for a specific product based on their affinity and threshold.
        """
        # Create a product vector
        is_electronics = 1.0 if product_category == 'electronics' else 0.0
        is_apparel = 1.0 if product_category == 'apparel' else 0.0
        
        product_vector = np.array([[is_electronics, is_apparel]])
        
        results = []
        for buyer_id in candidate_ids:
            if buyer_id not in self.buyer_features.index:
                continue
                
            buyer = self.buyer_features.loc[buyer_id]
            
            # Skip if product price is above their threshold
            if product_price > buyer['price_threshold']:
                continue
                
            buyer_vector = np.array([[buyer['electronics_affinity'], buyer['apparel_affinity']]])
            
            # Content collaborative filtering score (Cosine Similarity)
            affinity_score = cosine_similarity(product_vector, buyer_vector)[0][0]
            
            # Final compound score: Affinity * Recency
            compound_score = affinity_score * buyer['recency_score']
            
            results.append({
                'buyer_id': buyer_id,
                'compound_score': compound_score,
                'affinity_score': affinity_score
            })
            
        # Sort by compound score descending
        results.sort(key=lambda x: x['compound_score'], reverse=True)
        return results

if __name__ == "__main__":
    engine = DemandEngine()
    candidates = ['B001', 'B002', 'B003', 'B004']
    print("Ranking buyers for electronics priced at 1200:")
    print(engine.rank_buyers('electronics', 1200, candidates))
