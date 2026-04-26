from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
import datetime
import os

# 1. Initialize the Flask Web Server
app = Flask(__name__)
CORS(app)  # This will allow requests from any origin

# 2. Connect to MongoDB Atlas (CHANGE THIS STRING!)
MONGO_URI = os.environ.get("MONGO_URI")
client = MongoClient(MONGO_URI)

# 3. Select the Database and Collection (Table)
db = client['smart_waste_IoT_db']
collection = db['sensor_data']

# Create a simple homepage 
@app.route('/', methods=['GET'])
def home():
    return " Smart Bin IoT Server is running perfectly!"


@app.route('/api/data', methods=['GET'])
def get_sensor_data():
    try:
        # 1. Connect to your collection
        collection = db['sensor_data'] 

        # 2. Fetch the 20 most recent readings
        # Sort by _id -1 (Newest first) and limit to 20
        cursor = collection.find().sort('_id', -1).limit(20)
        
        # 3. Convert the MongoDB cursor to a list
        data = list(cursor)

        # 4. CRITICAL: Convert MongoDB 'ObjectId' to a string
        # Python's jsonify cannot handle MongoDB's raw ID format
        for item in data:
            item['_id'] = str(item['_id'])

        # 5. Reverse the list 
        # We want the chart to show: [Oldest -> Newest]
        data.reverse()

        return jsonify(data), 200

    except Exception as e:
        print(f"❌ Database Fetch Error: {e}")
        return jsonify({"message": "Failed to fetch data"}), 500
    
    

# 4. Create the REST API Endpoint to receive data
@app.route('/api/data', methods=['POST'])
def receive_data():
    try:
        # Get the JSON data sent by the ESP32
        incoming_data = request.get_json()

        # Add a server-side timestamp just in case the ESP32 doesn't have the exact time
        incoming_data['timestamp'] = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Insert the data into MongoDB
        collection.insert_one(incoming_data)

        # Print to the VS Code terminal so you can see it working
        print(f" Data saved successfully: {incoming_data}")

        # Send a success message back to the ESP32
        return jsonify({"status": "success", "message": "Data stored in MongoDB"}), 201

    except Exception as e:
        print(f" Error saving data: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# 5. Start the server
if __name__ == '__main__':
    # host='0.0.0.0' allows other devices on your Wi-Fi (like the ESP32) to connect
    # port=5000 is the standard port for Flask APIs
    app.run(host='0.0.0.0', port=5000, debug=True)