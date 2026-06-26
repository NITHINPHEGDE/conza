const mongoose = require('mongoose')

const payoutSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  recipientId: { type: String, required: true },
  type: { type: String, enum: ['worker', 'vendor', 'business_partner'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' },
  bankDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  processedBy: { type: String, default: '' },
  processedAt: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Payout', payoutSchema)
