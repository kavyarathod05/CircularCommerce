import boto3
from boto3.dynamodb.conditions import Attr

class DynamicPricingEngine:
    """
    GenAI Dynamic Pricing Engine
    Executes demand-aware discounts to optimize inventory liquidity and prevent obsolescence.
    Uses DynamoDB ListingsTable to find competitor pricing dynamically.
    """
    def __init__(self, region_name='us-east-1'):
        self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
        self.listings_table = self.dynamodb.Table('ListingsTable')
        self.base_discount_rate = 0.10 # Starts at 10% off
        self.max_discount_rate = 0.50  # Cap at 50% off
        
    def calculate_current_price(self, product_id, original_price, hours_on_market, local_demand_score):
        """
        Dynamically adjusts the price based on time and demand.
        Queries the ListingsTable for competitor prices.
        """
        competitor_prices = []
        try:
            res = self.listings_table.scan(
                FilterExpression=Attr('ProductId').eq(product_id) & Attr('Status').eq('available')
            )
            for item in res.get('Items', []):
                # Try getting either 'Price', 'OriginalPrice', or 'msrp'
                price_val = item.get('Price') or item.get('OriginalPrice') or item.get('msrp')
                if price_val:
                    competitor_prices.append(float(price_val))
        except Exception as e:
            print(f"Warning: Failed to fetch competitor prices from ListingsTable: {e}")
            
        # 1. Time decay: increase discount by 2% every 24 hours
        days_on_market = hours_on_market / 24.0
        time_discount = days_on_market * 0.02
        
        # 2. Demand modifier: if demand is low, increase discount
        demand_discount = 0.05 if local_demand_score < 0.3 else 0.0
        
        # 3. Competitor matching: if competitor is cheaper, match up to 5%
        comp_min = min(competitor_prices) if competitor_prices else original_price
        comp_discount = 0.0
        if comp_min < original_price:
            comp_discount = min(0.05, (original_price - comp_min) / original_price)
            
        total_discount = self.base_discount_rate + time_discount + demand_discount + comp_discount
        total_discount = min(total_discount, self.max_discount_rate)
        
        current_price = original_price * (1 - total_discount)
        return {
            'original_price': original_price,
            'current_price': round(current_price, 2),
            'discount_applied': f"{round(total_discount * 100, 1)}%"
        }

if __name__ == "__main__":
    engine = DynamicPricingEngine()
    print("Pricing evaluation after 48 hours, low demand:")
    print(engine.calculate_current_price('p-smartphone', 1000, 48, 0.2))
