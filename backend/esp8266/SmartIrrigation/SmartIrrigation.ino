#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ─── USER CONFIGURATION ──────────────────────────────────────
const char* WIFI_SSID = "success";
const char* WIFI_PASSWORD = "123456789";
const char* SERVER_URL = "http://192.168.137.127:5000";
const char* DEVICE_ID = "MAC: 84:0D:8E:86:32:86";
const char* DEVICE_API_KEY = "my_secret_irrigation_device_key_2026";
const char* FIRMWARE_VER  = "1.0.8"; // Combined Version
// ─────────────────────────────────────────────────────────────

// --- PIN DEFINITIONS TO MATCH YOUR DASHBOARD ---
#define SOIL_MOISTURE_PIN A0   
#define FLOAT_SWITCH_PIN  D2   
#define PH_SENSOR_PIN     D1   
#define RELAY_PIN         D3   
#define BUZZER_PIN        D4   
#define DHTPIN            D5   
#define DHTTYPE           DHT11

DHT dht(DHTPIN, DHTTYPE);

// --- CALIBRATION & THRESHOLDS ---
const int DRY_SOIL = 1023;       
const int WET_SOIL = 300;        
const int MOISTURE_THRESHOLD = 40; 

// --- TIMING CONSTANTS ---
const unsigned long LOCAL_INTERVAL_MS = 5000; 
const unsigned long HEARTBEAT_INTERVAL_MS  = 12000; 
const unsigned long SENSOR_SEND_INTERVAL_MS = 30000;

unsigned long previousLocalMs = 0;
unsigned long lastHeartbeatMs  = 0;
unsigned long lastSensorSendMs = 0;

// State Variables for server reporting
String pumpStatus  = "OFF";
String buzzerStatus = "OFF";

// Sensor reading globals so sendSensorData can access them
int currentMoisturePercent = -999;
int currentRawMoisture = 0;
float currentTemp = -999;
float currentHumidity = -999;
float currentPH = -999;
int currentTankPct = 0;

void setup() {
  Serial.begin(115200);
  delay(500); 
  Serial.println("\n[AgriSmart] Booting Combined Firmware...");

  dht.begin();
  pinMode(PH_SENSOR_PIN, INPUT);           
  
  // --- WATER SENSOR FIX ---
  // Using standard INPUT. The sensor will physically pull the pin HIGH when wet.
  pinMode(FLOAT_SWITCH_PIN, INPUT_PULLUP); 
  
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // OFF
  
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW); // OFF
  
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected. Reconnecting...");
    connectWiFi();
  }

  unsigned long currentMillis = millis();

  // 1. LOCAL AUTOMATION (Every 5 seconds)
  if (currentMillis - previousLocalMs >= LOCAL_INTERVAL_MS) {
    previousLocalMs = currentMillis;
    runLocalAutomation();
  }

  // 2. SERVER HEARTBEAT (Every 12 seconds)
  if (currentMillis - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = currentMillis;
    sendHeartbeat();
  }

  // 3. SERVER DATA SYNC (Every 30 seconds)
  if (currentMillis - lastSensorSendMs >= SENSOR_SEND_INTERVAL_MS) {
    lastSensorSendMs = currentMillis;
    sendSensorData();
  }

  delay(100);
}

void runLocalAutomation() {
  currentHumidity = dht.readHumidity();
  currentTemp = dht.readTemperature();
  if (isnan(currentHumidity)) currentHumidity = -999;
  if (isnan(currentTemp)) currentTemp = -999;
  
  // --- ANALOG SENSOR ON DIGITAL PIN FIX ---
  // Dry = LOW (0V). Wet = HIGH (Voltage passes through water).
  int rawWaterLevel = digitalRead(FLOAT_SWITCH_PIN);
  
  bool isTankEmpty = (rawWaterLevel == HIGH); 
  
  if (isTankEmpty) {
    currentTankPct = 0;   // Not immersed = 0%
  } else {
    currentTankPct = 100; // Immersed = 100%
  }

  currentRawMoisture = analogRead(SOIL_MOISTURE_PIN);
  if (currentRawMoisture < 50) { 
    currentMoisturePercent = -999; 
  } else {
    currentMoisturePercent = map(currentRawMoisture, DRY_SOIL, WET_SOIL, 0, 100);
    currentMoisturePercent = constrain(currentMoisturePercent, 0, 100);
  }

  // pH is broken because A0 is used by moisture. Hardcode to -999.
  currentPH = -999.0;

  Serial.println("---------------------------------------------");
  if (currentTemp > -998) {
    Serial.printf("Air Temp: %.1f°C | Air Humidity: %.1f%%\n", currentTemp, currentHumidity);
  } else {
    Serial.println("Error reading DHT11 sensor!");
  }
  
  if (currentMoisturePercent != -999) {
    Serial.printf("Soil Moisture: %d%% (Raw: %d)\n", currentMoisturePercent, currentRawMoisture);
  } else {
    Serial.println("Soil Moisture: UNPLUGGED (--%)");
  }
  
  Serial.printf("Water Tank State: %s\n", isTankEmpty ? "EMPTY ❌" : "OK (FULL) ");

  // --- LOCAL PUMP LOGIC ---
  // Tank empty safety override removed
  triggerBuzzer(false);
  // The pump is strictly controlled by the backend server via HTTP response!
}

void setPump(bool turnOn) {
  if (turnOn) {
    digitalWrite(RELAY_PIN, LOW); // ON
    pumpStatus = "ON";
  } else {
    digitalWrite(RELAY_PIN, HIGH); // OFF
    pumpStatus = "OFF";
  }
}

void triggerBuzzer(bool turnOn) {
  if (turnOn) {
    digitalWrite(BUZZER_PIN, HIGH);
    buzzerStatus = "ON";
    delay(80); 
    digitalWrite(BUZZER_PIN, LOW);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerStatus = "OFF";
  }
}

// ─── WI-FI & SERVER FUNCTIONS ────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
  } else {
    Serial.println("\n[WiFi] Failed.");
  }
}

int readBatteryLevel() {
  return 100;
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClient wifiClient;
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp8266/heartbeat";
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Api-Key", DEVICE_API_KEY);

  StaticJsonDocument<256> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["firmwareVersion"] = FIRMWARE_VER;
  doc["signalStrength"]  = WiFi.RSSI();
  doc["batteryLevel"]    = readBatteryLevel();
  String body; serializeJson(doc, body);
  http.POST(body);
  http.end();
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClient wifiClient;
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp8266/data";
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Api-Key", DEVICE_API_KEY);
  http.setTimeout(8000);

  StaticJsonDocument<512> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["pumpStatus"]      = pumpStatus;
  doc["batteryLevel"]    = readBatteryLevel();
  doc["signalStrength"]  = WiFi.RSSI();
  doc["firmwareVersion"] = FIRMWARE_VER;

  JsonArray sensors = doc.createNestedArray("sensors");
  
  JsonObject s1 = sensors.createNestedObject();
  s1["type"]  = "moisture";
  s1["value"] = currentMoisturePercent;
  
  JsonObject s2 = sensors.createNestedObject();
  s2["type"]  = "temperature";
  s2["value"] = currentTemp;
  
  JsonObject s3 = sensors.createNestedObject();
  s3["type"]  = "humidity";
  s3["value"] = currentHumidity;
  
  JsonObject s4 = sensors.createNestedObject();
  s4["type"]  = "pH";
  s4["value"] = currentPH;
  
  JsonObject s5 = sensors.createNestedObject();
  s5["type"]  = "tankLevel";
  s5["value"] = currentTankPct;

  String body; serializeJson(doc, body);
  int code = http.POST(body);
  
  if (code == 200) {
    String response = http.getString();
    StaticJsonDocument<256> resp;
    DeserializationError err = deserializeJson(resp, response);
    if (!err) {
      Serial.println("[Data] Sensor data sent successfully");
      
      // The server is the brain! It decides based on weather API, rules, and manual toggles.
      if (resp.containsKey("pump")) {
        const char* cmdPump = resp["pump"];
        // Tank empty safety override removed
        if (String(cmdPump) == "ON") {
          setPump(true);
          Serial.println("🌐 Server turned pump ON.");
        } else if (String(cmdPump) == "OFF") {
          setPump(false);
          Serial.println("🌐 Server turned pump OFF.");
        }
      }
      
      if (resp.containsKey("buzzer")) {
        const char* cmdBuzzer = resp["buzzer"];
        if (String(cmdBuzzer) == "ON") triggerBuzzer(true);
      }
    }
  } else {
    Serial.printf("[Data] Send failed, HTTP %d\n", code);
  }
  http.end();
}
