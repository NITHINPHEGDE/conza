const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  admin: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  module: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['approval', 'suspension', 'wallet', 'payout', 'removal', 'dispute', 'role', 'refund', 'content', 'settings', 'creation', 'deletion', 'update', 'login', 'other'],
    default: 'other',
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
})

auditLogSchema.index({ adminId: 1, createdAt: -1 })
auditLogSchema.index({ module: 1, createdAt: -1 })
auditLogSchema.index({ severity: 1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)