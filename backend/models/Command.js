const mongoose = require('mongoose');

const CommandSchema = new mongoose.Schema({
  deviceId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  sensorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' }, // Optional target sensor/actuator
  commandType: { type: String, required: true }, // e.g. 'PUMP_ON', 'PUMP_OFF', 'VALVE_OPEN', 'VALVE_CLOSE', 'AUTO_MODE', 'MANUAL_MODE'
  parameters:  { type: mongoose.Schema.Types.Mixed }, // Structured parameters
  payload:     { type: mongoose.Schema.Types.Mixed }, // Additional data payload
  status:      { type: String, enum: ['pending', 'sent', 'acknowledged', 'failed', 'executed'], default: 'pending' },
  issuedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who triggered the command
  issuedAt:    { type: Date, default: Date.now },
  executedAt:  { type: Date },
  response:    { type: mongoose.Schema.Types.Mixed }, // Device response payload
}, { timestamps: true });

CommandSchema.index({ deviceId: 1, status: 1 });
CommandSchema.index({ issuedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Command', CommandSchema);
