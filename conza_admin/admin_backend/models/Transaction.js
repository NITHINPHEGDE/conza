const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['booking', 'order', 'wallet', 'payout', 'refund'], default: 'booking' },
  user: { type: String, required: true },
  userId: { type: String },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['upi', 'card', 'cod', 'cash', 'wallet', 'razorpay'], default: 'upi' },
  status: { type: String, enum: ['success', 'pending', 'failed', 'refunded'], default: 'pending' },
  referenceId: { type: String, default: '' },
  description: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

transactionSchema.index({ userId: 1, status: 1, type: 1, createdAt: -1 })

module.exports = mongoose.model('Transaction', transactionSchema)
