const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['push', 'sms', 'email'], required: true },
  title: { type: String, default: '' },
  message: { type: String, required: true },
  target: { type: String, enum: ['all', 'customers', 'workers', 'vendors', 'business_partners', 'specific'], default: 'all' },
  targetIds: { type: [String], default: [] },
  status: { type: String, enum: ['sent', 'failed', 'pending', 'scheduled'], default: 'pending' },
  sentBy: { type: String, default: '' },
  sentByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  sentCount: { type: Number, default: 0 },
  scheduledAt: { type: Date, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)
