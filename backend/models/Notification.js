const mongoose = require('mongoose');

/**
 * Notification — in-app and push alerts sent to a specific user.
 *
 * Normalization fix: Added sourceRef (polymorphic link to what triggered the
 * notification), farmId for farm-scoped filtering, and proper indexes.
 * Added { timestamps: true } for createdAt/updatedAt tracking.
 */
const NotificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' }, // scope to farm
  title:     { type: String, default: '' },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['alarm', 'info', 'warning', 'success'], required: true },
  priority:  { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  read:      { type: Boolean, default: false },
  isRead:    { type: Boolean, default: false }, // alias for read
  readAt:    { type: Date },

  // Polymorphic back-reference — what triggered this notification
  sourceRef: {
    kind: {
      type: String,
      enum: ['SensorData', 'IrrigationLog', 'MaintenanceTicket', 'Expense', 'Activity', 'User', 'Task'],
    },
    item: { type: mongoose.Schema.Types.ObjectId },
  },

  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────
// Fetch all unread notifications for a user (bell icon count)
NotificationSchema.index({ userId: 1, read: 1 });
// Per-user history, newest first
NotificationSchema.index({ userId: 1, timestamp: -1 });
// TTL: auto-delete notifications older than 90 days
NotificationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('Notification', NotificationSchema);
