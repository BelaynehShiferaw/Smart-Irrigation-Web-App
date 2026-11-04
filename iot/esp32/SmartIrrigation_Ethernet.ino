/**
 * ============================================================
 * AgriSmart Irrigation System - ESP32 RJ45 Ethernet Firmware
 * Compatible with ESP32 Built-in Ethernet (WT32-ETH01 / LAN8720)
 * ============================================================
 *
 * Hardware Wiring on ESP32 / WT32-ETH01:
 *   GPIO 36 (Sensor VP / A0) -> Soil Moisture Sensor (Analog Input)
 *   GPIO 39 (Sensor VN)      -> Water Level Float Sensor
 *   GPIO 35                  -> pH Sensor (Analog Input)
 *   GPIO 4                   -> Water Pump Relay (Active-LOW: LOW = ON)
 *   GPIO 2                   -> Alarm Buzzer
 *   GPIO 14                  -> DHT11 / DHT22 Data Pin (Temp & Humidity)
 *
 * Dependencies (Install via Arduino IDE Library Manager):
 *   - ArduinoJson (by Benoit Blanchon, version >= 6.x)
 *   - DHT sensor library (by Adafruit)
 *   - Adafruit Unified Sensor
 *
 * Arduino IDE Settings:
 *   Board: "ESP32 Dev Module" (or "WT32-ETH01")
 *   Upload Speed: 115200 (or 921600)
 * ============================================================
 */

#include <ETH.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ─── USER CONFIGURATION ──────────────────────────────────────
// IP address of your computer running the backend server
const char* SERVER_URL     = "http://192.168.1.100:5000";

// Unique Device ID (register this in the Web Dashboard)
const char* DEVICE_ID      = "ESP32_ETH_001";

// Must match DEVICE_API_KEY in backend/.env
const char* DEVICE_API_KEY = "my_secret_irrigation_device_key_2026";

// Firmware version
const char* FIRMWARE_VER   = "1.1.0-ETH";
// ─────────────────────────────────────────────────────────────

// ─── PIN DEFINITIONS ─────────────────────────────────────────
#define SOIL_MOISTURE_PIN 36   // Analog input ADC1_CH0
#define WATER_LEVEL_PIN   39   // Analog/Digital input ADC1_CH3
#define PH_PIN            35   // Analog input ADC1_CH7
#define PUMP_RELAY_PIN    4    // Digital Output to Relay (Active-LOW)
#define BUZZER_PIN        2    // Digital Output to Buzzer
#define DHT_PIN           14   // Digital Pin for DHT Sensor
#define DHT_TYPE          DHT11 // Set to DHT11 or DHT22
// ─────────────────────────────────────────────────────────────

// ─── ETHERNET HARDWARE CONFIG (WT32-ETH01 / LAN8720) ─────────
#define ETH_PHY_TYPE      ETH_PHY_LAN8720
#define ETH_PHY_ADDR      1
#define ETH_PHY_MDC       23
#define ETH_PHY_MDIO      18
#define ETH_PHY_POWER     16
#define ETH_CLK_MODE      ETH_CLOCK_GPIO0_IN
// ─────────────────────────────────────────────────────────────

// ─── TIMING INTERVALS ────────────────────────────────────────
const unsigned long HEARTBEAT_INTERVAL_MS  = 12000;  // 12 seconds
const unsigned long SENSOR_SEND_INTERVAL_MS = 30000; // 30 seconds
// ─────────────────────────────────────────────────────────────

DHT dht(DHT_PIN, DHT_TYPE);

// System state
static bool eth_connected = false;
String pumpStatus  = "OFF";
String buzzerStatus = "OFF";
unsigned long lastHeartbeatMs  = 0;
unsigned long lastSensorSendMs = 0;

// Ethernet Event Handler
void WiFiEvent(WiFiEvent_t event) {
  switch (event) {
    case ARDUINO_EVENT_ETH_START:
      Serial.println("[ETH] Ethernet Started");
      ETH.setHostname("esp32-irrigation");
      break;
    case ARDUINO_EVENT_ETH_CONNECTED:
      Serial.println("[ETH] Cable Plugged In (Link Up)");
      break;
    case ARDUINO_EVENT_ETH_GOT_IP:
      Serial.print("[ETH] IP Obtained: ");
      Serial.println(ETH.localIP());
      Serial.print("[ETH] Subnet Mask: ");
      Serial.println(ETH.subnetMask());
      Serial.print("[ETH] Gateway: ");
      Serial.println(ETH.gatewayIP());
      eth_connected = true;
      break;
    case ARDUINO_EVENT_ETH_DISCONNECTED:
      Serial.println("[ETH] Cable Disconnected");
      eth_connected = false;
      break;
    case ARDUINO_EVENT_ETH_STOP:
      Serial.println("[ETH] Ethernet Stopped");
      eth_connected = false;
      break;
    default:
      break;
  }
}

// ─── SENSOR READING FUNCTIONS ────────────────────────────────
int readMoisture() {
  // ESP32 ADC: 0 (wet) to 4095 (dry)
  int raw = analogRead(SOIL_MOISTURE_PIN);
  int pct = map(raw, 4095, 1200, 0, 100);
  pct = constrain(pct, 0, 100);
  Serial.printf("[Sensor] Soil Moisture: %d%% (raw: %d)\n", pct, raw);
  return pct;
}

float readTemperature() {
  float t = dht.readTemperature();
  if (isnan(t)) {
    Serial.println("[Sensor] DHT temperature reading failed");
    return -999;
  }
  Serial.printf("[Sensor] Temperature: %.1f deg C\n", t);
  return t;
}

float readHumidity() {
  float h = dht.readHumidity();
  if (isnan(h)) {
    Serial.println("[Sensor] DHT humidity reading failed");
    return -999;
  }
  Serial.printf("[Sensor] Humidity: %.1f%%\n", h);
  return h;
}

float readPH() {
  int raw = analogRead(PH_PIN);
  float voltage = raw * (3.3 / 4095.0);
  float ph = 3.5 * voltage + 0.0; // Calibrate slope & intercept for your sensor
  ph = constrain(ph, 0.0, 14.0);
  Serial.printf("[Sensor] pH: %.2f (voltage: %.2fV)\n", ph, voltage);
  return ph;
}

int readTankLevel() {
  int raw = digitalRead(WATER_LEVEL_PIN);
  // HIGH = water present (tank OK), LOW = tank empty
  int pct = (raw == HIGH) ? 90 : 10;
  Serial.printf("[Sensor] Tank Level: %d%%\n", pct);
  return pct;
}

// ─── SEND HEARTBEAT ──────────────────────────────────────────
void sendHeartbeat() {
  if (!eth_connected) return;

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp8266/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Api-Key", DEVICE_API_KEY);
  http.setTimeout(5000);

  StaticJsonDocument<256> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["firmwareVersion"] = FIRMWARE_VER;
  doc["signalStrength"]  = 100; // Ethernet wired signal is 100%
  doc["batteryLevel"]    = 100;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code == 200) {
    Serial.println("[Heartbeat] OK (200)");
  } else {
    Serial.printf("[Heartbeat] Failed, HTTP Status: %d\n", code);
  }
  http.end();
}

// ─── SEND SENSOR DATA & RECEIVE COMMANDS ─────────────────────
void sendSensorData() {
  if (!eth_connected) return;

  int   moisture = readMoisture();
  float temp     = readTemperature();
  float humidity = readHumidity();
  float ph       = readPH();
  int   tank     = readTankLevel();

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp8266/data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Api-Key", DEVICE_API_KEY);
  http.setTimeout(8000);

  StaticJsonDocument<512> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["pumpStatus"]      = pumpStatus;
  doc["batteryLevel"]    = 100;
  doc["signalStrength"]  = 100;
  doc["firmwareVersion"] = FIRMWARE_VER;

  JsonArray sensors = doc.createNestedArray("sensors");

  if (moisture >= 0) {
    JsonObject s1 = sensors.createNestedObject();
    s1["type"]  = "moisture";
    s1["value"] = moisture;
  }
  if (temp > -998) {
    JsonObject s2 = sensors.createNestedObject();
    s2["type"]  = "temperature";
    s2["value"] = temp;
  }
  if (humidity > -998) {
    JsonObject s3 = sensors.createNestedObject();
    s3["type"]  = "humidity";
    s3["value"] = humidity;
  }
  {
    JsonObject s4 = sensors.createNestedObject();
    s4["type"]  = "pH";
    s4["value"] = ph;
  }
  {
    JsonObject s5 = sensors.createNestedObject();
    s5["type"]  = "tankLevel";
    s5["value"] = tank;
  }

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code == 200) {
    String response = http.getString();
    Serial.println("[Data] Telemetry sent successfully. Server response:");
    Serial.println(response);

    StaticJsonDocument<256> resp;
    DeserializationError err = deserializeJson(resp, response);

    if (!err) {
      // Pump control
      String serverPump = resp["pump"] | pumpStatus;
      if (serverPump != pumpStatus) {
        pumpStatus = serverPump;
        if (pumpStatus == "ON") {
          digitalWrite(PUMP_RELAY_PIN, LOW); // Active-low: LOW = ON
          Serial.println("[Actuator] Pump turned ON");
        } else {
          digitalWrite(PUMP_RELAY_PIN, HIGH); // Active-low: HIGH = OFF
          Serial.println("[Actuator] Pump turned OFF");
        }
      }

      // Buzzer control
      String serverBuzzer = resp["buzzer"] | buzzerStatus;
      if (serverBuzzer != buzzerStatus) {
        buzzerStatus = serverBuzzer;
        if (buzzerStatus == "ON") {
          digitalWrite(BUZZER_PIN, HIGH);
          Serial.println("[Actuator] Buzzer turned ON");
        } else {
          digitalWrite(BUZZER_PIN, LOW);
          Serial.println("[Actuator] Buzzer turned OFF");
        }
      }
    }
  } else {
    Serial.printf("[Data] Send failed, HTTP Error: %d\n", code);
  }
  http.end();
}

// ─── SETUP ───────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n============================================");
  Serial.println(" AgriSmart ESP32 Ethernet System Booting... ");
  Serial.println("============================================");

  // Configure actuator pins
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(WATER_LEVEL_PIN, INPUT);

  // Safe defaults (PUMP OFF, BUZZER OFF)
  digitalWrite(PUMP_RELAY_PIN, HIGH); // HIGH is OFF for active-low relay
  digitalWrite(BUZZER_PIN, LOW);

  dht.begin();

  // Register Ethernet network event callback
  WiFi.onEvent(WiFiEvent);

  // Start Ethernet PHY (LAN8720)
  ETH.begin(ETH_PHY_TYPE, ETH_PHY_ADDR, ETH_PHY_MDC, ETH_PHY_MDIO, ETH_PHY_POWER, ETH_CLK_MODE);
}

// ─── MAIN LOOP ───────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // Send heartbeat ping every 12 seconds
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = now;
    sendHeartbeat();
  }

  // Send full sensor data every 30 seconds
  if (now - lastSensorSendMs >= SENSOR_SEND_INTERVAL_MS) {
    lastSensorSendMs = now;
    sendSensorData();
  }

  delay(100);
}
