const mongoose = require('mongoose')

const loginHistorySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  user: {
    type: String,
    default: 'Unknown',
  },
  email: {
    type: String,
    default: '-',
  },
  role: {
    type: String,
    default: '-',
  },
  ip: {
    type: String,
    default: '',
  },
  device: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: 'Unknown',
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
  },
  failureReason: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
})

loginHistorySchema.index({ adminId: 1, createdAt: -1 })

module.exports = mongoose.model('LoginHistory', loginHistorySchema)