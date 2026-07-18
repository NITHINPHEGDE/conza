const mongoose = require('mongoose');

// Complaints raised by a customer via "Report an Issue" in the Support
// section. Read (and status-updated) by the admin panel's Engagement →
// Complaints screen, which connects to this same database via a secondary
// mongoose connection (see conza_admin/admin_backend/config/customersDb.js).
const complaintSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, trim: true }, // customer's full name, snapshotted at report time
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phone: { type: String, required: true, trim: true }, // customer's phone, snapshotted at report time

    type: {
      type: String,
      enum: ['booking', 'order', 'payment', 'app', 'worker', 'vendor', 'other'],
      default: 'other',
    },

    subject: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },

    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'escalated'],
      default: 'open',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },

    assignedTo: { type: String, default: '' },
    resolution: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    isEscalated: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

complaintSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
