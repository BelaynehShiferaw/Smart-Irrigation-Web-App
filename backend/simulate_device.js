const axios = require('axios');
require('dotenv').config();

const DEVICE_MAC = 'MAC: 84:0D:8E:86:32:86'; 
const API_KEY = process.env.DEVICE_API_KEY || 'my_secret_irrigation_device_key_2026';
const SERVER_URL = 'http://localhost:5000';

let soilMoisture = 45;
let temperature = 24.0;
let pumpState = 'OFF';

async function sendData() {
  try {
    // 1. Send Heartbeat (makes it Online)
    await axios.post(`${SERVER_URL}/api/esp8266/heartbeat`, {
      deviceId: DEVICE_MAC,
      batteryLevel: 85,
      signalStrength: -60,
      firmwareVersion: '1.0.8'
    }, {
      headers: { 'X-Device-Api-Key': API_KEY }
    });

    // 2. Send Sensor Data
    // Randomize slightly for realistic charts
    soilMoisture += (Math.random() * 2 - 1);
    temperature += (Math.random() * 0.4 - 0.2);
    if (soilMoisture < 30) pumpState = 'ON';
    if (soilMoisture > 70) pumpState = 'OFF';

    const dataPayload = {
      deviceId: DEVICE_MAC,
      batteryLevel: 85,
      signalStrength: -60,
      firmwareVersion: '1.0.8',
      pumpStatus: pumpState,
      sensors: [
        { type: 'moisture', value: Math.round(soilMoisture) },
        { type: 'temperature', value: Number(temperature.toFixed(1)) },
        { type: 'humidity', value: 55 }
      ]
    };

    await axios.post(`${SERVER_URL}/api/esp8266/data`, dataPayload, {
      headers: { 'X-Device-Api-Key': API_KEY }
    });

    console.log(`[${new Date().toLocaleTimeString()}] Sent data | Moisture: ${Math.round(soilMoisture)}% | Pump: ${pumpState}`);
  } catch (err) {
    console.error('Error sending data:', err.response?.data || err.message);
  }
}

console.log('Starting ESP8266 Simulator... Press Ctrl+C to stop.');
// Send immediately, then every 5 seconds
sendData();
setInterval(sendData, 5000);
