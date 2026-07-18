const mongoose = require('mongoose')
const customersDB = require('../config/customersDb')

// Schema mirrors conza_customers/conza_backend/models/Complaint.js, bound to the
// SEPARATE customers MongoDB connection (CUSTOMERS_MONGO_URI), reading the
// real "complaints" collection created by the customer app (Report an Issue).
const complaintSchema = new mongoose.Schema({
  user: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  phone: { type: String, default: '' },
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
}, { timestamps: true, strict: false })

module.exports = customersDB.model('Complaint', complaintSchema)
