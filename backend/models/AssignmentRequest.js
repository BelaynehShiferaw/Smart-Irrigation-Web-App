const mongoose = require('mongoose');

const assignmentRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['farm_farmer', 'farm_labor', 'task_assignment'],
    default: 'farm_labor',
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  description: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt:  { type: Date },
  rejectedAt:  { type: Date },
  notes:       { type: String, default: '' },
}, { timestamps: true });

assignmentRequestSchema.index({ farmId: 1, status: 1 });
assignmentRequestSchema.index({ requestedBy: 1, status: 1 });

module.exports = mongoose.model('AssignmentRequest', assignmentRequestSchema);
