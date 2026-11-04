# AgriSmart Irrigation System - Hardware Documentation

This document provides a comprehensive overview of the microcontrollers, sensors, and actuators used in the Smart Irrigation Management System, along with their wiring configurations and communication protocols.

## 1. Microcontrollers

The system supports two different microcontroller architectures for flexibility in deployment depending on network availability (Ethernet vs. Wi-Fi).

### Option A: ESP32 with Ethernet (WT32-ETH01 / LAN8720)
Used for highly reliable, wired connections in environments where Wi-Fi might be unstable.
*   **Board Type**: ESP32 Dev Module / WT32-ETH01
*   **Connectivity**: Built-in Ethernet (RJ45) using LAN8720 PHY
*   **Operating Voltage**: 3.3V logic, 5V power input.
*   **Firmware Location**: `iot/esp32/SmartIrrigation_Ethernet.ino`
*   **Key Features**: Includes offline buffering (via SPIFFS/LittleFS) to store telemetry data locally if the network goes down, batch-publishing when the connection is restored.

### Option B: ESP8266 (NodeMCU 1.0 ESP-12E Module)
Used for standard, flexible wireless deployments.
*   **Board Type**: NodeMCU 1.0 (ESP-12E Module)
*   **Connectivity**: 2.4 GHz Wi-Fi
*   **Operating Voltage**: 3.3V logic, 5V power input via USB.
*   **Firmware Location**: `backend/esp8266/SmartIrrigation.ino` & `iot/esp8266_client/esp8266_client.ino`

---

## 2. Sensors

The system continuously monitors environmental and system conditions to automate irrigation.

| Sensor | Type | Purpose | Operating Ranges / Notes |
| :--- | :--- | :--- | :--- |
| **Capacitive Soil Moisture Sensor** | Analog | Measures the volumetric water content in the soil. | Outputs raw ADC values (converted to 0-100% moisture). An automatic fallback triggers the pump if moisture drops below the 30% threshold. |
| **DHT11 / DHT22 Sensor** | Digital | Measures ambient air temperature and humidity. | DHT11 is standard, but DHT22 provides higher precision for temperature (°C) and humidity (%). |
| **Water Level Float Sensor** | Digital | Monitors the water reservoir tank to prevent dry-running the pump. | Outputs `HIGH` when water is present (90% capacity assumed) and `LOW` when the tank is empty (10% capacity). |
| **pH Sensor** | Analog | Measures soil/water acidity and alkalinity. | Connected via a voltage divider/ADC multiplexer. Calculates pH using `ph = 3.5 * voltage`. |
| **Water Flow Sensor** | Pulse | *(ESP32 Extension)* Measures water consumption. | Mentioned in IoT architecture for advanced telemetry tracking. |

---

## 3. Actuators & Indicators

| Component | Type | Purpose |
| :--- | :--- | :--- |
| **Water Pump Relay** | Digital (Active-LOW) | Controls the 12V DC water pump. A `LOW` signal turns the relay (and pump) ON. |
| **Alarm Buzzer** | Digital | Sounds an audible alarm when critical conditions are met (e.g., the water tank is completely empty). |

---

## 4. Hardware Wiring Reference

### ESP8266 (NodeMCU) Wiring Diagram
| NodeMCU Pin | Component Connection |
| :--- | :--- |
| **A0** | Soil Moisture Sensor (Analog Out) |
| **D1 (GPIO 5)** | Water Level Float Sensor (Digital) |
| **D2 (GPIO 4)** | pH Sensor (Analog via ADC conversion) |
| **D3 (GPIO 0)** | Water Pump Relay (Active-LOW: IN pin) |
| **D4 (GPIO 2)** | Alarm Buzzer |
| **D5 (GPIO 14)** | DHT11 / DHT22 Data Pin |
| **3.3V / GND** | Sensor VCC / GND |
| **VIN / GND** | Relay VCC (5V) / GND |

### ESP32 (WT32-ETH01) Wiring Diagram
| ESP32 Pin | Component Connection |
| :--- | :--- |
| **GPIO 36 (A0)** | Soil Moisture Sensor (Analog Out) |
| **GPIO 39** | Water Level Float Sensor |
| **GPIO 35** | pH Sensor (Analog) |
| **GPIO 4** | Water Pump Relay (Active-LOW) |
| **GPIO 2** | Alarm Buzzer |
| **GPIO 14** | DHT11 / DHT22 Data Pin |

---

## 5. Telemetry & Control Protocol

Data is sent to the Node.js backend using HTTP POST requests (with MQTT support planned/available in the ESP32 phase 2 architecture). 

### Frequency
*   **Heartbeat Ping**: Sent every 12 seconds to confirm the device is online. (`POST /api/esp8266/heartbeat`)
*   **Telemetry Data**: Full sensor payload sent every 30 seconds. (`POST /api/esp8266/data`)

### Payload Example (Device -> Server)
```json
{
  "deviceId": "ESP32_ETH_001",
  "pumpStatus": "OFF",
  "batteryLevel": 100,
  "signalStrength": 100,
  "firmwareVersion": "1.1.0-ETH",
  "sensors": [
    { "type": "moisture", "value": 45 },
    { "type": "temperature", "value": 24.5 },
    { "type": "humidity", "value": 60 },
    { "type": "pH", "value": 6.5 },
    { "type": "tankLevel", "value": 90 }
  ]
}
```

### Security & Authentication
*   Every request is authenticated using a `X-Device-Api-Key` header matching the backend's environment variables.
*   Devices must be pre-registered via the web dashboard using their unique MAC Address (`DEVICE_ID`) before data is accepted.

---

## 6. Local Automation Logic
The microcontrollers possess local fallback logic independent of the server:
1.  **Auto-Irrigation**: If the soil moisture drops below the hardcoded threshold (e.g., 30%) and the water tank is *not* empty, the pump automatically activates.
2.  **Dry-Run Protection & Alarm**: If the water level sensor reads `LOW` (empty tank), the pump will not run, and the local buzzer sounds an alarm to alert nearby personnel.
