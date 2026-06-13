import numpy as np
from sklearn.ensemble import RandomForestRegressor
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import warnings
warnings.filterwarnings('ignore')

np.random.seed(42)

# Generate synthetic dataset
n_samples = 2000
repair_cost = np.random.uniform(5, 50, n_samples)
depreciation = np.random.uniform(0.1, 0.4, n_samples)
# AI Grade (A=4, B=3, C=2, D=1)
ai_grade = np.random.choice([4, 3, 2, 1], n_samples)
distance_km = np.random.uniform(1, 100, n_samples)

# Net Margin formula heuristic
net_margin = (
    100 
    - (repair_cost * (5 - ai_grade)) 
    - (depreciation * 200) 
    - (distance_km * 0.5)
)

X = np.column_stack((repair_cost, depreciation, ai_grade, distance_km)).astype(np.float32)
y = net_margin.astype(np.float32)

model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
model.fit(X, y)

initial_type = [('float_input', FloatTensorType([None, 4]))]
onx = convert_sklearn(model, initial_types=initial_type)
with open("margin_predictor.onnx", "wb") as f:
    f.write(onx.SerializeToString())

print("Trained Margin Predictor model and saved to margin_predictor.onnx")
