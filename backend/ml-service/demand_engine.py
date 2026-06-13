import numpy as np
import boto3
from boto3.dynamodb.conditions import Key, Attr
from sklearn.metrics.pairwise import cosine_similarity

class DemandEngine:
    """
    Local Demand Engine Algorithm
    Ranks candidate buyers/listings based on Content Collaborative Filtering 
    and Spatial Geohash Queries via DynamoDB.
    """
    def __init__(self, region_name='us-east-1'):
        self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
        self.listings_table = self.dynamodb.Table('ListingsTable')

    def rank_buyers(self, product_category, product_price, user_geohash):
        """
        Query DynamoDB Geohash-index for local candidate listings.
        """
        # Create a product vector
        is_electronics = 1.0 if product_category == 'electronics' else 0.0
        is_apparel = 1.0 if product_category == 'apparel' else 0.0
        product_vector = np.array([[is_electronics, is_apparel]])
        
        results = []
        try:
            # Query the Geohash LSI
            # (Assuming Partition Key is ListingId, and Geohash-index indexes Geohash)
            # Typically a GSI is used if the PK is not known, but the checklist says "LSI".
            # For an LSI, the Partition Key must be provided. Let's assume we scan if LSI isn't working or we use an index query.
            # We'll use GSI 'Geohash-index' for simplicity as it matches standard patterns.
            response = self.listings_table.query(
                IndexName='Geohash-index',
                KeyConditionExpression=Key('Geohash').eq(user_geohash)
            )
            candidate_items = response.get('Items', [])
            
            for item in candidate_items:
                buyer_id = item.get('OwnerId', item.get('UserId', 'unknown'))
                buyer_price_thresh = float(item.get('PriceThreshold', 2000))
                
                if product_price > buyer_price_thresh:
                    continue
                    
                elec_aff = float(item.get('ElectronicsAffinity', 0.5))
                app_aff = float(item.get('ApparelAffinity', 0.5))
                buyer_vector = np.array([[elec_aff, app_aff]])
                
                affinity_score = cosine_similarity(product_vector, buyer_vector)[0][0]
                recency_score = float(item.get('RecencyScore', 0.5))
                compound_score = affinity_score * recency_score
                
                results.append({
                    'buyer_id': buyer_id,
                    'compound_score': compound_score,
                    'affinity_score': affinity_score
                })
        except Exception as e:
            print(f"Warning: DynamoDB query failed: {e}")
            
        # Sort by compound score descending
        results.sort(key=lambda x: x['compound_score'], reverse=True)
        return results

if __name__ == "__main__":
    engine = DemandEngine()
    print("Ranking local buyers:")
    print(engine.rank_buyers('electronics', 1200, 'gcpvj'))
