class DynamicPricingEngine:
    """
    GenAI Dynamic Pricing Engine
    Executes demand-aware discounts to optimize inventory liquidity and prevent obsolescence.
    """
    def __init__(self):
        self.base_discount_rate = 0.10 # Starts at 10% off
        self.max_discount_rate = 0.50  # Cap at 50% off
        
    def calculate_current_price(self, original_price, hours_on_market, local_demand_score, competitor_prices):
        """
        Dynamically adjusts the price based on time and demand.
        """
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
    print(engine.calculate_current_price(1000, 48, 0.2, [950, 980]))
