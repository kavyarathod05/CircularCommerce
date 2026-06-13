import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split

np.random.seed(42)

# Generate synthetic dataset
n_samples = 5000
historical_returns = np.random.poisson(1.5, n_samples)
dwell_time_seconds = np.random.exponential(120, n_samples)
multiple_sizes_in_cart = np.random.binomial(1, 0.15, n_samples)
original_price = np.random.lognormal(mean=np.log(2000), sigma=1.0, size=n_samples)

# Return probability heuristic to generate target
logits = (
    -2.0 
    + 0.8 * historical_returns
    - 0.01 * dwell_time_seconds
    + 2.5 * multiple_sizes_in_cart
    + 0.0001 * original_price
)
probs = 1 / (1 + np.exp(-logits))
returned_item = np.random.binomial(1, probs)

df = pd.DataFrame({
    'historical_returns': historical_returns,
    'dwell_time_seconds': dwell_time_seconds,
    'multiple_sizes_in_cart': multiple_sizes_in_cart,
    'original_price': original_price,
    'returned_item': returned_item
})

df.to_csv('friction_dataset.csv', index=False)

X = df[['historical_returns', 'dwell_time_seconds', 'multiple_sizes_in_cart', 'original_price']]
y = df['returned_item']

model = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, use_label_encoder=False, eval_metric='logloss')
model.fit(X, y)

model.save_model('friction_model.json')
print("Trained XGBoost friction model and saved to friction_model.json")
