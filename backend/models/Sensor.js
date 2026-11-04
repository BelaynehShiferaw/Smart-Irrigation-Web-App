const mongoose = require('mongoose');

const SensorSchema = new mongoose.Schema({
  deviceId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  name:        { type: String, default: '' },
  sensorType:  { type: String }, // e.g. soil_moisture, temperature, humidity, water_level, pH
  type:        { type: String, enum: ['moisture', 'waterLevel', 'pH', 'temperature', 'humidity'], required: true },
  unit:        { type: String, required: true },
  status:      { type: String, enum: ['active', 'faulty'], default: 'active' },
  pin:         { type: String, default: '' },
  calibration: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

SensorSchema.index({ deviceId: 1 });

module.exports = mongoose.model('Sensor', SensorSchema);
