const mongoose = require('mongoose')

const complaintSchema = new mongoose.Schema({
  user: { type: String, required: true },
  userId: { type: String },
  type: { type: String, enum: ['booking', 'order', 'payment', 'app', 'worker', 'vendor', 'other'], default: 'other' },
  subject: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed', 'escalated'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  assignedTo: { type: String, default: '' },
  resolution: { type: String, default: '' },
  refundAmount: { type: Number, default: 0 },
  isEscalated: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
}, { timestamps: true })

module.exports = mongoose.model('Complaint', complaintSchema)
