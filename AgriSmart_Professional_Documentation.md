<div align="center">
  
# BAHIR DAR UNIVERSITY
## FACULTY OF COMPUTING

<br/>

# AGRISMART
### SMART IRRIGATION MANAGEMENT SYSTEM
 
**Professional Project Documentation**  
*Structured using the Rapid Application Development (RAD) methodology*

</div>

<br/>

> **System Type:** Full-Stack IoT Agricultural Management Platform  
> **Current IoT Device:** ESP8266 NodeMCU | **Current Transport:** Wi-Fi + HTTP REST  
> **Prepared:** September 2026

---

## Document Overview
*   **Purpose:** This document presents the AgriSmart system as a professional software and IoT project report. The wording and technical statements are based on the project documentation supplied for this revision.
*   **RAD Project methodology:** Iterative development with requirements planning, user design, construction and cutover.
*   **IoT + Web Application type:** Field devices, backend services, database and a role-based dashboard.
*   **HTTP REST Communication:** The current ESP8266 implementation uses HTTP; MQTT is documented as a future/alternative transport.
*   **English + Amharic Localization:** The frontend includes `i18next`/`react-i18next` localization support.
*   *This report is intentionally narrative rather than table-heavy. Technical specifications are presented through structured prose, numbered requirements, workflow descriptions, callout blocks and diagrams to make the document easier to read and more suitable for academic submission.*

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Introduction](#2-introduction)
3. [RAD Methodology](#3-rapid-application-development-methodology)
4. [Requirements Planning](#4-requirements-planning)
5. [User Design](#5-user-design)
6. [Construction](#6-construction)
7. [Cutover](#7-cutover)
8. [System Architecture](#8-system-architecture)
9. [Functional Requirements](#9-functional-requirements)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [User Roles and Authorization](#11-user-roles-and-authorization)
12. [IoT Hardware and Communication](#12-iot-hardware-and-communication)
13. [Database Design](#13-database-design)
14. [API and Integration Design](#14-api-and-integration-design)
15. [Irrigation Automation](#15-irrigation-automation)
16. [User Interface](#16-user-interface)
17. [Security](#17-security)
18. [Testing and Quality Assurance](#18-testing-and-quality-assurance)
19. [Deployment and Maintenance](#19-deployment-and-maintenance)
20. [Limitations and Future Enhancements](#20-limitations-and-future-enhancements)
21. [Conclusion](#21-conclusion)
*   [Appendix A – Current Project Structure](#appendix-a--current-project-structure)
*   [Appendix B – Key Configuration Values](#appendix-b--key-configuration-values)

---

## 1. Executive Summary
AgriSmart is a full-stack Internet of Things (IoT) smart irrigation and farm-management platform designed to connect field sensing and actuation with centralized software services. The system collects soil moisture, temperature, humidity, water-level and pH-related measurements, stores information in MongoDB, evaluates irrigation conditions, supports manual and automatic pump control, and presents information to authorized users through a web dashboard.

The system is organized into three major layers. The first is the IoT edge layer, implemented with an ESP8266 NodeMCU device and field sensors. The second is the backend service, implemented with Node.js and Express, where authentication, authorization, business rules, device communication, automation and notifications are handled. The third is the React-based web dashboard used by different categories of users.

The project also includes operational functions such as tasks, attendance, payroll, maintenance, reports and audit logging. RAD is used as the organizing development methodology because the system can be improved through short iterations, prototypes, feedback and incremental integration.

> [!NOTE]
> **Implementation accuracy:** The current ESP8266 firmware uses HTTP POST requests for heartbeat and sensor-data transmission. MQTT appears in the project documentation as a design for a future or alternative communication approach, not as the active transport in the current firmware.

---

## 2. Introduction

### 2.1 Background
Irrigation decisions are affected by continuously changing soil and environmental conditions. Manual observation can be slow, inconsistent and difficult to record. AgriSmart addresses this operational problem by combining field sensors, wireless communication, server-side processing, automated irrigation rules and a centralized management dashboard.

### 2.2 Problem Statement
Conventional irrigation operations may experience over-irrigation, under-irrigation, delayed detection of dry soil, poor visibility of pump and device status, and limited historical records. The project therefore requires a centralized system capable of collecting field information, monitoring equipment, supporting controlled irrigation decisions and maintaining operational records.

### 2.3 General Objective
The general objective is to design and implement an IoT-enabled smart irrigation management system that supports real-time monitoring, automatic and manual irrigation control, role-based management, notifications and reporting.

### 2.4 Specific Objectives
*   Collect soil, environmental and water-level data from field devices.
*   Transmit and store sensor information in a centralized backend.
*   Provide real-time monitoring through a web dashboard.
*   Automate pump decisions using soil-moisture and water-level rules.
*   Support authorized manual pump and buzzer control.
*   Track device online and offline status.
*   Provide role-based access for agricultural and administrative users.
*   Provide notifications, tasks, maintenance, reports and audit records.
*   Support English and Amharic user-interface localization.

---

## 3. Rapid Application Development Methodology
Rapid Application Development emphasizes iterative requirements analysis, prototype-driven user design, fast construction and controlled cutover. For an IoT project such as AgriSmart, this approach is useful because hardware, communication, backend logic and user-interface components can be validated independently before being integrated.

### 3.1 Requirements Planning
The requirements-planning phase identifies the irrigation problem, stakeholders, system scope, security needs, IoT requirements, reporting requirements and workforce-management needs. The expected result is an agreed project scope and a prioritized set of functional and non-functional requirements.

### 3.2 User Design
The user-design phase translates requirements into dashboard workflows, role permissions, data relationships and IoT interaction flows. User journeys are reviewed before the implementation is finalized so that system behavior remains understandable to farmers, administrators and other stakeholders.

### 3.3 Construction
Construction produces the React frontend, Node.js/Express backend, MongoDB data layer, automation services and ESP8266 firmware. Integration is performed incrementally so that device communication, persistence, real-time updates and actuator control can be tested as each component becomes available.

### 3.4 Cutover
The cutover phase prepares the system for operational use. It includes environment configuration, database preparation, device registration, firmware configuration, deployment, user onboarding and verification of telemetry, commands and alerts.

> [!TIP]
> **RAD development loop:** Requirements → Prototype → User Review → Revision → Construction → Testing → Cutover → feedback into the next iteration.

---

## 4. Requirements Planning

### 4.1 Stakeholders
*   **Owner / Investor:** Responsible for farm ownership, operations, assignments and financial visibility.
*   **Administrator:** Responsible for user approval, system administration, security and audit oversight.
*   **Office Manager:** Supports administrative operations such as attendance, payroll, tasks and maintenance coordination.
*   **Farmer:** Responsible for farm monitoring, irrigation, sensor information, reports and field coordination.
*   **Labour:** Primarily interacts with assigned work, tasks, attendance and related information.
*   **IoT Device:** Acts as a system participant by acquiring sensor measurements, reporting its status and executing actuator commands.

### 4.2 System Scope
The project scope covers authentication and account approval, farm and device management, sensor monitoring and history, automatic and manual irrigation, device status, alerts, notifications, task and assignment workflows, attendance, payroll, maintenance, operational and financial reporting, audit logging, and bilingual interface support.

> [!WARNING]
> **Current constraints:** The active firmware uses HTTP REST rather than MQTT; pH measurement requires hardware-specific calibration; tank-level sensing is currently simplified to a digital state; and ESP8266 battery reporting is currently an estimate or placeholder.

### 4.3 Feasibility Analysis
*   **Technical:** Feasible with ESP8266, Wi-Fi, React, Node.js/Express and MongoDB. 
*   **Operational:** Centralized monitoring can significantly reduce dependence on manual observation. 
*   **Economical:** Uses commonly available microcontroller and sensor hardware with open-source software components. 
*   **Schedule:** RAD supports incremental development rather than requiring all modules to be completed simultaneously. 
*   **Security:** Feasible through authentication, authorization, device API-key protection, validation, rate limiting and audit logging.

---

## 5. User Design

### 5.1 Core Workflows
1.  Registration → pending account → administrator review → role assignment → active account → authorized dashboard.
2.  Device registration → device identity/API key → heartbeat → online status → sensor telemetry → database → real-time dashboard.
3.  Low moisture → automation evaluation → tank and weather checks → `PUMP_ON` command → device relay activates the pump.
4.  Optimal moisture or critical tank condition → `PUMP_OFF` command → pump stops → notification when appropriate.

### 5.2 Role-Centered Use Cases
*   **Administrators** use the system to approve or reject users, manage user access, review audit logs and perform system-level administration. 
*   **Owners** manage farms, monitor irrigation operations, approve or assign operational activities and review financial information.
*   **Office Managers** work with tasks, payroll, attendance, assignments and maintenance activities. 
*   **Farmers** work with farm control, devices, sensors, historical information, reports and labour coordination. 
*   **Labour** users focus on assigned tasks, attendance, work information and payslips. 
*   **IoT devices** participate through heartbeat reporting, telemetry transmission and actuator-command processing.

### 5.3 User Design Principles
*   Role-specific navigation keeps the interface relevant to each user.
*   Backend authorization, rather than frontend menu hiding alone, protects restricted operations.
*   Real-time information is presented without requiring repeated manual refresh where Socket.IO is used.
*   Critical conditions are surfaced through alerts and configurable notifications.
*   English and Amharic localization is supported.
*   Important system activities are traceable through audit logging.

---

## 6. Construction

### 6.1 Technology Stack
*   **Frontend:** React 19 and Vite, supported by React Router (navigation), React Icons (interface components), Recharts (analytics), Leaflet (geographic visualization), and i18next/react-i18next (localization). 
*   **Backend:** Node.js and Express for APIs and business logic. 
*   **Database:** MongoDB with Mongoose provides persistent storage.
*   **Real-time:** Socket.IO supports real-time updates and alerts.
*   **Security & Testing:** JWT-based authentication components, bcryptjs, Helmet, CORS configuration, rate limiting, express-validator and Yup validation. Jest and Supertest support automated testing. node-cron is used for periodic irrigation evaluation.

### 6.2 IoT Hardware
The current edge device is an ESP8266 NodeMCU 1.0 (ESP-12E). The field hardware includes a soil-moisture sensor, DHT11 temperature and humidity sensor, a water-level sensor, a pH-related analog input, a relay module for pump switching and a buzzer for local alarms.

### 6.3 Current Pin Mapping
| Component | Pin | Description |
| :--- | :--- | :--- |
| **Soil moisture** | `A0` | Analog soil-moisture measurement. |
| **Water level** | `D1` | Digital tank-level state. |
| **pH input** | `D2` | Analog pH-related input. |
| **Pump relay** | `D3` | Active-low control: LOW = ON and HIGH = OFF. |
| **Buzzer** | `D4` | Local alarm output. |
| **DHT11** | `D5` | Temperature and humidity. |

> [!IMPORTANT]
> **Relay behavior:** The pump relay is active-low in the current firmware: a LOW output turns the pump ON and HIGH turns the pump OFF.

### 6.4 Current IoT Communication
The ESP8266 initiates communication with the backend by sending heartbeat and sensor-data requests over Wi-Fi. The backend authenticates the device, stores telemetry in MongoDB and can return pending actuator commands as part of the device response.
Socket.IO is used between the backend and the browser dashboard so that sensor, device and alert information can be presented in real time without relying only on repeated page refreshes.

---

## 7. Cutover
The cutover stage moves the system from development into controlled operation. Environment variables are configured, MongoDB is prepared, devices are registered, firmware is programmed with the appropriate connectivity details, and the frontend and backend are deployed.

### 7.1 Environment and Database Preparation
1.  Configure the MongoDB connection, trusted frontend origins, device API key and notification credentials.
2.  Start MongoDB and confirm that the application connects successfully.

### 7.2 IoT and User Onboarding
3.  Register each device and associate it with the correct farm.
4.  Configure the ESP8266 with Wi-Fi credentials, backend URL, device ID and API key before flashing.
5.  Register users, review pending accounts, approve valid users and assign appropriate roles.

### 7.3 Operational Verification
6.  Verify device heartbeat and online/offline status.
7.  Verify sensor telemetry and real-time dashboard updates.
8.  Verify authorized pump and buzzer commands.
9.  Verify alerts, notifications, logs and reporting workflows.

---

## 8. System Architecture
The web dashboard is the presentation layer where users interact with the system. It communicates with the Node.js/Express backend through REST APIs and Socket.IO. The backend enforces authentication and role-based authorization, performs business logic, communicates with the database, processes device requests and executes automation services.

MongoDB stores users, farms, devices, telemetry, commands, irrigation logs, notifications, tasks, attendance, payroll, maintenance records, expenses and audit information. The ESP8266 operates at the edge and communicates with the backend through HTTP REST in the current implementation.

### 8.1 Backend Logical Modules
*   **Routes:** Expose authentication, farm, device, sensor, irrigation and management APIs. 
*   **Controllers:** Process selected business operations. 
*   **Models:** Define MongoDB entities and relationships. 
*   **Middleware:** Provides authentication, device authentication, auditing, validation and error handling. 
*   **Services:** Contain automation, device monitoring, weather and notification-related business logic.

---

## 9. Functional Requirements
*   **FR-01 Registration** — Users can submit registration information and request a role.
*   **FR-02 Approval** — Accounts support pending, active, rejected, suspended and deactivated states.
*   **FR-03 Authentication** — The system authenticates authorized users.
*   **FR-04 Authorization** — Protected operations depend on the assigned role.
*   **FR-05 Farm Management** — Authorized users manage farm information.
*   **FR-06 Device Management** — Authorized users register and monitor devices.
*   **FR-07 Telemetry** — The server receives and stores sensor data from devices.
*   **FR-08 Real-Time Updates** — The dashboard receives live device and sensor events.
*   **FR-09 Automatic Irrigation** — The backend evaluates irrigation rules and creates pump commands.
*   **FR-10 Manual Control** — Authorized users can issue permitted actuator commands.
*   **FR-11 Alerts** — The system creates warnings and alarms for critical conditions.
*   **FR-12 History** — The system stores sensor and irrigation history.
*   **FR-13 Notifications** — The system maintains application notifications and external notifications when configured.
*   **FR-14 Tasks** — The system manages operational tasks and assignments.
*   **FR-15 Maintenance** — The system manages maintenance workflows.
*   **FR-16 Reports** — The system provides operational and financial reports.
*   **FR-17 Audit** — Important API operations are logged.
*   **FR-18 Localization** — The interface supports English and Amharic.

---

## 10. Non-Functional Requirements
*   **Performance** — The API and dashboard should respond promptly under normal operating conditions.
*   **Availability** — The backend should remain available during irrigation monitoring.
*   **Security** — Credentials, tokens and device authentication must be protected.
*   **Usability** — Interfaces should be understandable to agricultural and administrative users.
*   **Scalability** — Additional farms, devices and users should be addable without redesigning the complete system.
*   **Maintainability** — Modular routes, models, services and frontend components support maintenance.
*   **Reliability** — Heartbeat and offline monitoring provide visibility into device health.
*   **Auditability** — Important system operations should be traceable through logs.

---

## 11. User Roles and Authorization

### 11.1 Owner / Investor
The Owner or Investor has business-level responsibility for farms, assignments, operational visibility and financial information. Access should be limited to functions required for these responsibilities.

### 11.2 Administrator
The Administrator provides system and security administration, including user review, account management and audit oversight.

### 11.3 Office Manager
The Office Manager handles administrative workflows including tasks, attendance, payroll, assignments and maintenance coordination.

### 11.4 Farmer
The Farmer uses the system for farm operations, sensor monitoring, irrigation control, historical information, reports and field coordination.

### 11.5 Labour
The Labour role focuses on assigned work, tasks, attendance, payslip-related information and other responsibilities provided through the dashboard.

> [!IMPORTANT]
> **Authorization principle:** The backend must enforce permissions. Hiding a menu item in the React interface is not, by itself, a security control.

---

## 12. IoT Hardware and Communication
The current firmware sends a heartbeat approximately every 12 seconds and sensor data approximately every 30 seconds. The backend stores telemetry and can respond with pending pump or buzzer commands.

### 12.1 Example Telemetry Payload
```json
{
  "deviceId": "AA:BB:CC:DD:EE:01",
  "pumpStatus": "OFF",
  "batteryLevel": 100,
  "signalStrength": -55,
  "firmwareVersion": "1.0.4",
  "sensors": [
    {"type":"moisture","value":42},
    {"type":"temperature","value":24.5},
    {"type":"humidity","value":61},
    {"type":"pH","value":6.8},
    {"type":"tankLevel","value":85}
  ]
}
```

### 12.2 MQTT Status in the Project
The project documentation defines MQTT topics for telemetry, commands and acknowledgements. That design can be adopted in a future version for lower-overhead bidirectional messaging and offline buffering. The present ESP8266 firmware, however, uses HTTP REST.

> [!NOTE]
> **Important distinction:** Documenting an MQTT architecture does not mean MQTT is already active in the device firmware. The report keeps these two states separate.

---

## 13. Database Design
The database design is organized around users, farms and devices, with operational records linked to those primary entities. A User can be associated with one or more farm-related responsibilities; a Farm can contain multiple Devices; each Device can generate many SensorData records, Commands and IrrigationLog entries.

### 13.1 Core Entities
*   **User** — Identity, roles, account status, farm assignment and preferences.
*   **Farm** — Owner, location, agricultural profile and irrigation-related information.
*   **Device** — Farm association, MAC address, status, battery, signal and firmware.
*   **SensorData** — Individual sensor measurements.
*   **IrrigationLog** — Pump state transitions and irrigation history.
*   **Command** — Actuator commands and acknowledgement state.
*   **Notification** — Alerts and user/farm notifications.
*   **AuditLog** — Traceability of system operations.
*   **Task** — Operational work and assignments.
*   **Attendance** — Work attendance.
*   **Payroll** — Payroll and payslip information.
*   **MaintenanceTicket** — Maintenance workflow and issue tracking.
*   **Expense** — Expense records or requests.

### 13.2 Logical Relationship
```text
User 1 ─────< Farm
Farm 1 ──────< Device
Device 1 ────< SensorData
Device 1 ────< Command
Device 1 ────< IrrigationLog
Farm 1 ──────< Notification
User 1 ──────< Task / Attendance / Payroll / Expense
```

---

## 14. API and Integration Design
The backend exposes REST endpoint groups for authentication, farm management, device management, sensors, irrigation, dashboard data, reports, notifications, audit logs, tasks, maintenance, attendance and payroll. Dedicated ESP8266 endpoints receive device heartbeats and sensor data.

### 14.1 Major Endpoint Groups
*   `/api/auth` — Registration, login and account recovery.
*   `/api/farms` — Farm management.
*   `/api/devices` — Device management.
*   `/api/sensors` — Sensor operations.
*   `/api/irrigation` — Irrigation operations.
*   `/api/dashboard` — Dashboard data.
*   `/api/reports` — Operational reports.
*   `/api/notifications` — Notifications.
*   `/api/audit-logs` — Audit logs.
*   `/api/tasks` — Task management.
*   `/api/maintenance` — Maintenance.
*   `/api/attendance` — Attendance.
*   `/api/payroll` — Payroll.
*   `/api/esp8266/heartbeat` — Device heartbeat.
*   `/api/esp8266/data` — Sensor ingestion and command response.

---

## 15. Irrigation Automation
The backend schedules irrigation evaluation every five minutes. It evaluates the latest stored readings from online devices and can consult weather forecast information before issuing an irrigation command.

### 15.1 Default Automation Rules
*   **Condition:** Moisture below 30%, tank level above 20%, and rain is not expected  
    **Action:** Create a `PUMP_ON` command and an information notification.
*   **Condition:** Moisture at or above 70%  
    **Action:** Create a `PUMP_OFF` command when no pending off command exists.
*   **Condition:** Tank level below 5%  
    **Action:** Create a `PUMP_OFF` command and a critical notification; SMS/email may be attempted when configured.
*   **Condition:** Tank level reaches 0 during ingestion  
    **Action:** Generate an alert indicating an empty tank and automatic irrigation should be disabled.
*   **Condition:** Available N/P/K values are low  
    **Action:** Create a debounced fertilizer recommendation when those measurements exist.

> [!WARNING]
> **Calibration note:** These are software rules contained in the project and should be calibrated against actual crops, soil, climate, sensor characteristics and agronomic practice before production use.

---

## 16. User Interface
The interface is organized around the responsibilities of each user. Public pages introduce the system, while authenticated pages provide role-specific dashboards and operational tools.

*   **Home / About / Contact** — Public project and system information.
*   **Login / Registration / Recovery** — Authentication and account lifecycle.
*   **Dashboard** — Role-specific system overview.
*   **Farm Control** — Irrigation and farm monitoring.
*   **Devices / Sensors / History** — Device health and historical measurements.
*   **Notifications** — Alerts and system messages.
*   **Tasks / Assignments** — Operational workforce coordination.
*   **Attendance / Payroll** — Workforce administration.
*   **Maintenance** — Maintenance tickets and workflows.
*   **Reports** — Operational and financial reporting.
*   **Audit Logs** — System traceability.
*   **Settings** — User and application preferences.

### 16.1 Localization
The frontend includes `i18next`/`react-i18next` localization support and a language context for English and Amharic. The intended experience is to change language without requiring a full page reload.

---

## 17. Security
*   Passwords are hashed using `bcrypt` before storage.
*   Token-based authentication is used in the backend architecture.
*   Role and account-status checks protect restricted operations.
*   ESP8266 endpoints require device authentication/API-key protection.
*   `Helmet` provides HTTP security headers.
*   `CORS` restricts browser origins to configured values.
*   Rate limiting protects the API and authentication endpoints.
*   `express-validator` and `Yup` provide input validation.
*   Audit logging provides traceability of important operations.
*   Environment variables hold deployment-specific secrets and configuration.

> [!TIP]
> **Production hardening:** Use HTTPS/TLS, rotate secrets and device credentials, restrict database access, back up the database, and use centralized secret management when moving beyond a development environment.

---

## 18. Testing and Quality Assurance
The backend includes Jest/Supertest testing support for authentication, authorization middleware, automation and sensor ingestion. Quality assurance should combine automated tests with end-to-end IoT validation and user-acceptance testing.

### 18.1 Representative Test Cases
| Test ID | Action | Expected Result |
| :--- | :--- | :--- |
| **T-01** | Register a new user | The account enters the pending state. |
| **T-02** | Inactive user accesses a protected operation | Access is denied. |
| **T-03** | Administrator approves a user | The user receives an active status and assigned role. |
| **T-04** | Valid device heartbeat is received | The registered device becomes online. |
| **T-05** | Unregistered device sends sensor data | The request is rejected. |
| **T-06** | Valid telemetry is received | Data is stored and a real-time event is emitted. |
| **T-07** | Moisture < 30% with tank > 20% | `PUMP_ON` is created when the rain check allows. |
| **T-08** | Moisture reaches 70% | `PUMP_OFF` is created. |
| **T-09** | Tank falls below 5% | Pump-off and critical notification actions occur. |
| **T-10** | Restricted role accesses protected operation | Access is denied. |
| **T-11** | Excessive login attempts occur | Rate limiting is applied. |
| **T-12** | Device stops sending heartbeat | The device is eventually identified as offline. |

---

## 19. Deployment and Maintenance

### 19.1 Deployment Checklist
- [ ] Configure MongoDB connection and trusted frontend origins.
- [ ] Configure secure device API keys and notification credentials.
- [ ] Build the React frontend using production settings.
- [ ] Deploy the Node.js backend behind a suitable process manager or reverse proxy.
- [ ] Register every IoT device and associate it with the correct farm.
- [ ] Flash firmware with the correct Wi-Fi/backend/device configuration.
- [ ] Verify heartbeat, telemetry, real-time updates and actuator commands.
- [ ] Configure backups, logs and monitoring.

### 19.2 Maintenance Cycle
*   **Continuous:** Monitor device status, alerts and application errors. 
*   **Weekly:** Review audit logs, failed device requests and operational anomalies. 
*   **Monthly:** Review backups, user accounts, irrigation thresholds and maintenance tickets. 
*   **As Needed:** Firmware, dependencies and security credentials should be updated whenever necessary.

---

## 20. Limitations and Future Enhancements

### 20.1 Current Limitations
*   Current IoT communication is HTTP REST; MQTT is not the active firmware transport.
*   pH measurement requires proper sensor calibration and suitable analog hardware.
*   Tank-level sensing is currently simplified to a digital state.
*   ESP8266 battery level is currently estimated or placeholder information.
*   Production reliability depends on Wi-Fi, power stability, sensor quality and server availability.

### 20.2 Future Enhancements
*   Implement MQTT/MQTTS with a production broker.
*   Add edge-side offline telemetry buffering using LittleFS/SPIFFS.
*   Use calibrated pH hardware and an appropriate ADC.
*   Use continuous tank-level measurement.
*   Add secure OTA firmware updates.
*   Use stronger device authentication such as certificates for large deployments.
*   Add automated database backup and disaster-recovery procedures.
*   Expand frontend end-to-end testing.
*   Improve crop-specific agronomic decision models and evapotranspiration calculations.

---

## 21. Conclusion
AgriSmart provides an integrated IoT approach to irrigation monitoring and farm management. The system connects field sensing hardware to a Node.js/Express backend, MongoDB persistence and a React dashboard, while providing role-based access, automation, real-time updates, notifications and operational management.

The RAD methodology provides a practical framework because the project contains multiple interacting components that can be developed and validated incrementally. The current implementation establishes a strong foundation for smart irrigation, while the documented limitations identify the technical areas that should be strengthened before large-scale production deployment.

> [!NOTE]
> **Final project perspective:** The strength of the system is its integration: field data becomes actionable information, actionable information becomes controlled irrigation decisions, and those decisions are visible to authorized users through a single platform.

---

## Appendix A – Current Project Structure
This structure separates backend responsibilities from the frontend application while keeping the ESP8266 implementation and IoT documentation discoverable within the project repository.
```text
SAMART IRIGATION System/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── test/
│   ├── esp8266/
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── utils/
│       └── App.jsx
├── iot/
│   └── README.md
└── README.md
```

## Appendix B – Key Configuration Values

| Value | Description |
| :--- | :--- |
| `5000` | **Backend default port:** Default application server port documented in the project. |
| `mongodb://localhost:27017/smart_irrigation` | **Database:** Default local MongoDB connection used by the project. |
| `~12 seconds` | **Heartbeat interval:** Current device heartbeat transmission interval. |
| `~30 seconds` | **Sensor interval:** Current sensor transmission interval. |
| `5 minutes` | **Automation interval:** Current irrigation-rule evaluation frequency. |
| `< 30%` | **Low-moisture rule:** Default software threshold documented for automatic irrigation. |
| `≥ 70%` | **Moisture stop rule:** Default software threshold documented for pump-off automation. |
| `< 5%` | **Critical tank rule:** Default software threshold for critical tank handling. |
| `ESP8266 NodeMCU 1.0` | **Current device:** ESP-12E based controller in the current implementation. |

> [!NOTE]
> **Source note:** These values reflect the supplied project documentation and current implementation state.
