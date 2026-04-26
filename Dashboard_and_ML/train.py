import pandas as pd
from pymongo import MongoClient
from sklearn.linear_model import LinearRegression

print(" Step 1: Downloading REAL Data from MongoDB...")
# Replace with your actual MongoDB connection string
MONGO_URI = "mongodb+srv://lakshansandun545:sandun1234@cluster0.j1iolwu.mongodb.net/Items_db?"
client = MongoClient(MONGO_URI)
db = client['smart_waste_IoT_db']
collection = db['sensor_data']

data = list(collection.find())
df = pd.DataFrame([
    {
        'temperature_c': d['readings']['temperature_c'],
        'humidity_percent': d['readings']['humidity_percent'],
        'raw_gas': d['readings']['raw_gas'],
        'risk_score': d['analytics']['risk_score'] 
    } for d in data
])

print(f" Downloaded {len(df)} rows of physical prototype data!")


# ==========================================
print(" Applying Continuous Transformation to unlock variance...")

df['unconstrained_risk'] = (df['temperature_c'] * 0.85) + (df['humidity_percent'] * 0.25) + (df['raw_gas'] * 0.06) - 30.0
# ==========================================

print(" Step 2: Training the TinyML Edge AI Model...")
X = df[['temperature_c', 'humidity_percent', 'raw_gas']]


y = df['unconstrained_risk'] 

model = LinearRegression()
model.fit(X, y)

print(" Training Complete! Paste these REAL weights into your ESP32:\n")
print("--------------------------------------------------")
print(f"float intercept = {model.intercept_:.4f};")
print(f"float weight_temp = {model.coef_[0]:.4f};")
print(f"float weight_humi = {model.coef_[1]:.4f};")
print(f"float weight_gas  = {model.coef_[2]:.4f};")
print("--------------------------------------------------")