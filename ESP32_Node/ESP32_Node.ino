#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// --- Network Setup ---
const char* ssid = "Anuuuu";
const char* password = "anupama123";

String serverName = "https://smart-bin-iot-gamma.vercel.app/api/data";

// --- Sensor Setup ---
#define DHTPIN 4
#define DHTTYPE DHT22  
DHT dht(DHTPIN, DHTTYPE);
#define MQ135_PIN 34

// --- LED Pin Setup ---
#define LED_GREEN 13
#define LED_BLUE 12
#define LED_YELLOW 14
#define LED_RED 27

void turnOffAllLEDs() {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_BLUE, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
}

// --- TinyML Edge AI: Trained Risk Prediction ---
float getTrainedRisk(float t, float h, int g) {
  float intercept = -30.0000;
  float weight_temp = 0.8500;
  float weight_humi = 0.2500;
  float weight_gas  = 0.0600;

  // The model calculates the prediction using the learned weights
  float prediction = intercept + (t * weight_temp) + (h * weight_humi) + (g * weight_gas);
  
  // Ensure the final score stays safely between 0 and 100
  return constrain(prediction, 0, 100); 
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(MQ135_PIN, INPUT);

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  turnOffAllLEDs();

  Serial.print("\nConnecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n Connected to Wi-Fi!");
}

void loop() {
  // 1. Read Sensors
  float humidity = dht.readHumidity();
  float tempC = dht.readTemperature();
  int gasLevel = analogRead(MQ135_PIN);

  if (isnan(humidity) || isnan(tempC)) {
    Serial.println(" Hardware Error: Failed to read DHT sensor!");
    delay(2000);
    return;
  }

  // 2. Calculate Risk using the Trained Edge AI Model
  // We cast it to an (int) so it matches your LED logic perfectly
  int finalRiskScore = (int)getTrainedRisk(tempC, humidity, gasLevel);

  // 3. Determine Status & Light LED
  String status = "Low";
  turnOffAllLEDs(); 

  if (finalRiskScore <= 30) { 
    status = "Low"; 
    digitalWrite(LED_GREEN, HIGH); 
  }
  else if (finalRiskScore > 30 && finalRiskScore <= 60) { 
    status = "Moderate"; 
    digitalWrite(LED_BLUE, HIGH); 
  }
  else if (finalRiskScore > 60 && finalRiskScore <= 85) { 
    status = "High"; 
    digitalWrite(LED_YELLOW, HIGH); 
  }
  else if (finalRiskScore > 85) { 
    status = "CRITICAL"; 
    digitalWrite(LED_RED, HIGH); 
  }

  // 4. Send Data to Database
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"sensor_id\": \"bin_node_01\", ";
    jsonPayload += "\"readings\": {\"temperature_c\": " + String(tempC) + ", ";
    jsonPayload += "\"humidity_percent\": " + String(humidity) + ", ";
    jsonPayload += "\"raw_gas\": " + String(gasLevel) + "}, ";
    jsonPayload += "\"analytics\": {\"risk_score\": " + String(finalRiskScore) + ", ";
    jsonPayload += "\"risk_status\": \"" + status + "\"}}";

    int httpResponseCode = http.POST(jsonPayload);
    
    Serial.print("Sending Data... Server Response Code: ");
    Serial.println(httpResponseCode);

    http.end(); 
  } else {
    Serial.println(" Wi-Fi Disconnected!");
  }

  // Wait 1 min before sending the next data packet
  delay(60000); 
}