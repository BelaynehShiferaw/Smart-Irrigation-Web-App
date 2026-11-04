# Smart Irrigation Management System (SIMS)
## Comprehensive Project Documentation

---

## 1. Project Overview
The **Smart Irrigation Management System (SIMS)** is a full-stack Internet of Things (IoT) solution designed to automate agricultural and garden irrigation. By utilizing real-time data from environmental sensors, the system ensures optimal water usage, prevents over-watering, and provides remote monitoring and control capabilities through a web-based dashboard.

### Core Objectives
*   **Water Conservation**: Automate watering schedules based on real-time soil moisture levels rather than static timers.
*   **Remote Monitoring**: Allow farmers and users to monitor farm conditions (temperature, humidity, pH, and water tank levels) from anywhere in the world.
*   **Hardware Resilience**: Implement offline buffering and local fallback logic so that irrigation continues safely even if the internet connection is lost.
*   **Accessibility**: Provide a multilingual interface (English and Amharic) for diverse users.

---

## 2. System Architecture
The project is divided into three main layers: **IoT (Hardware)**, **Backend (Server)**, and **Frontend (User Interface)**.

### A. IoT / Hardware Layer
The hardware layer is responsible for interacting with the physical environment. 
*   **Microcontrollers**: 
    *   **ESP8266 (NodeMCU)**: Used for standard Wi-Fi communication.
    *   **ESP32 (WT32-ETH01)**: Used for highly reliable, wired Ethernet communication.
*   **Sensors**:
    *   *Capacitive Soil Moisture Sensor*: Measures soil water content.
    *   *DHT11 / DHT22*: Measures ambient air temperature and humidity.
    *   *Float Switch / Water Level Sensor*: Ensures the water tank is not empty.
    *   *pH Sensor*: Monitors the acidity/alkalinity of the water.
*   **Actuators**:
    *   *12V Water Pump & Relay*: Actively waters the crops when triggered.
    *   *Alarm Buzzer*: Alerts local personnel if the water tank runs dry or faults occur.

### B. Backend Layer (Node.js & Express)
The backend acts as the central brain of the system, bridging the hardware and the user interface.
*   **Framework**: Node.js with Express.js.
*   **Database**: MongoDB (Atlas or Local) for storing user profiles, device configurations, and historical telemetry data.
*   **Real-time Communication**: Utilizes WebSockets (Socket.IO) to push real-time sensor updates to the frontend dashboard.
*   **Security**: Secures user sessions with JWT (JSON Web Tokens) and authenticates IoT devices using unique `X-Device-Api-Key` headers.
*   **Services**: Features a Device Status Service that checks for heartbeats every 10 seconds. If a device misses heartbeats for 30 seconds, it is marked as *OFFLINE*.

### C. Frontend Layer (React & Vite)
The frontend provides a responsive, interactive web dashboard for users and administrators.
*   **Framework**: React.js built with Vite for fast performance.
*   **Features**:
    *   *Real-time Dashboard*: Live updates of soil moisture, temperature, and pump status.
    *   *Manual Controls*: Buttons to remotely override the pump and buzzer.
    *   *Multi-Language*: Built-in toggle to switch the interface between English and Amharic without reloading the page.
    *   *Device Management*: Administrators can register new farms and IoT devices (by MAC address).

---

## 3. Operational Logic & Workflows

### 3.1 Automatic Irrigation (Local Fallback)
To ensure reliability, the microcontrollers possess local automation logic:
1.  The sensor reads the soil moisture level.
2.  If moisture drops below the threshold (e.g., 30%) **AND** the water tank is not empty (`HIGH` reading from the float sensor):
3.  The microcontroller pulls the Relay pin `LOW` (turning the pump ON) and logs the event.

### 3.2 Dry-Run Protection
If the water tank float sensor reads `LOW` (tank empty):
1.  The microcontroller immediately disables the water pump to prevent hardware damage.
2.  The local buzzer sounds an alarm.
3.  The status is published to the backend, updating the web dashboard to alert the user.

### 3.3 Telemetry Data Transmission
*   **Heartbeat**: The device sends a lightweight ping to the server (`/api/esp8266/heartbeat`) every 12 seconds to confirm it is alive and well.
*   **Sensor Data**: The device sends a full JSON payload containing all sensor readings (`/api/esp8266/data`) every 30 seconds.

---

## 4. Setup & Deployment Summary

1.  **Database**: Setup a MongoDB cluster and configure the connection string in the `backend/.env` file.
2.  **Backend Environment**: Configure `JWT_SECRET`, `DEVICE_API_KEY`, and SMTP credentials (for password reset emails) in the `.env` file. Run with `npm install` and `node server.js` (or `pm2` for production).
3.  **Frontend**: Configure the `FRONTEND_URL` and API targets. Run `npm run build` to generate static files, which can be served via Nginx, Vercel, or Apache.
4.  **Hardware**: Flash the Arduino `.ino` code to the ESP8266/ESP32, ensuring the `WIFI_SSID`, `WIFI_PASSWORD`, and `DEVICE_API_KEY` match the deployment environment. Register the device's MAC address in the web dashboard to allow it to connect.

---
*For specific hardware wiring and pinouts, please see `HARDWARE.md`.*
*For specific software setup and commands, please see `SETUP.md`.*
