import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

np.random.seed(42)

# Generate synthetic size dataset
n_samples = 5000
user_chest = np.random.normal(40, 3, n_samples)
prod_m_chest = np.random.normal(38, 1, n_samples)
prod_l_chest = np.random.normal(42, 1, n_samples)

# Simple heuristic target generation: choose the size with the closest chest measurement
diff_m = np.abs(user_chest - prod_m_chest)
diff_l = np.abs(user_chest - prod_l_chest)

optimal_size = np.where(diff_m < diff_l, 'M', 'L')

df = pd.DataFrame({
    'user_chest': user_chest,
    'prod_m_chest': prod_m_chest,
    'prod_l_chest': prod_l_chest,
    'optimal_size': optimal_size
})

df.to_csv('size_dataset.csv', index=False)

X = df[['user_chest', 'prod_m_chest', 'prod_l_chest']]
y = df['optimal_size']

model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
model.fit(X, y)

joblib.dump(model, 'size_model.joblib')
print("Trained Random Forest size model and saved to size_model.joblib")
