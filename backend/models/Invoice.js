const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  farmId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  billedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // usually owner or farmer
  amount:   { type: Number, required: true },
  purpose:  { type: String, required: true, trim: true }, // e.g., "Monthly IoT Monitoring", "Irrigation Service Fee"
  status:   { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  dueDate:  { type: Date },
  paidAt:   { type: Date },
  tx_ref:   { type: String }, // Chapa transaction reference
}, { timestamps: true });

InvoiceSchema.index({ billedTo: 1, status: 1 });
InvoiceSchema.index({ farmId: 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
