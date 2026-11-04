const mongoose = require('mongoose');

/**
 * IrrigationLog — records every pump ON/OFF event.
 *
 * Normalization fix: Added farmId for direct farm-level reporting without
 * having to join through Device. Added triggeredByUser ref for manual overrides.
 * Added indexes for time-range queries and per-farm history views.
 */
const IrrigationLogSchema = new mongoose.Schema({
  farmId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  deviceId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  commandId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Command' }, // optional link to originating command
  status:          { type: String, enum: ['ON', 'OFF'], required: true },
  triggeredBy:     { type: String, enum: ['manual', 'auto', 'schedule'], required: true },
  triggeredByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mode:            { type: String, default: 'auto' }, // 'manual' | 'auto' | 'schedule'
  startedAt:       { type: Date },
  endedAt:         { type: Date },
  duration:        { type: Number, default: 0 }, // seconds
  waterVolume:     { type: Number, default: 0 }, // litres
  waterUsed:       { type: Number, default: 0 }, // litres (alias)
  timestamp:       { type: Date, default: Date.now },
}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────
// Per-device event history (most common query)
IrrigationLogSchema.index({ deviceId: 1, timestamp: -1 });
// Per-farm history for dashboard / reports
IrrigationLogSchema.index({ farmId: 1, timestamp: -1 });
// TTL: auto-delete logs older than 1 year
IrrigationLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

module.exports = mongoose.model('IrrigationLog', IrrigationLogSchema);
