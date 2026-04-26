import pandas as pd
import matplotlib.pyplot as plt
from pymongo import MongoClient
from sklearn.ensemble import IsolationForest

print(" Step 1: Downloading REAL Data from MongoDB...")

MONGO_URI = "mongodb+srv://lakshansandun545:sandun1234@cluster0.j1iolwu.mongodb.net/Items_db?" 
client = MongoClient(MONGO_URI)
db = client['smart_waste_IoT_db']
collection = db['sensor_data']

# Fetch data and convert to a pandas DataFrame
data = list(collection.find())
df = pd.DataFrame([
    {
        'temperature_c': d['readings']['temperature_c'],
        'humidity_percent': d['readings']['humidity_percent'],
        'raw_gas': d['readings']['raw_gas']
    } for d in data
])

print(f" Downloaded {len(df)} rows!")

print(" Step 2: Training the Isolation Forest Model...")
# The algorithm studies the relationship between Heat, Humidity, and Gas
X = df[['temperature_c', 'humidity_percent', 'raw_gas']]

# 'contamination=0.05' tells the AI we expect about 5% of our data to be anomalies (your marker/alcohol spikes)
model = IsolationForest(contamination=0.05, random_state=42)
model.fit(X) # This is the "Learning" phase

print(" Step 3: Searching for Toxic Spikes...")
# predict() returns 1 for normal data, and -1 for an anomaly
df['anomaly'] = model.predict(X)

print(" Step 4: Generating the Graph...")
plt.figure(figsize=(10, 6))

# Plot the normal everyday garbage data in blue
normal_data = df[df['anomaly'] == 1]
plt.scatter(normal_data.index, normal_data['raw_gas'], color='blue', label='Normal Baseline', alpha=0.5)

# Plot the toxic anomalies in bright red
anomalies = df[df['anomaly'] == -1]
plt.scatter(anomalies.index, anomalies['raw_gas'], color='red', label='DETECTED ANOMALY', s=70, edgecolor='black')

plt.title('Environmental Risk Monitoring: Automated Anomaly Detection')
plt.xlabel('Time (Reading Index)')
plt.ylabel('Raw Gas Level')
plt.legend()
plt.grid(True, linestyle='--', alpha=0.7)

# Save the professional chart as an image
plt.savefig('anomaly_detection_chart.png')
print(" Success! Check your folder for 'anomaly_detection_chart.png'")