const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
  ownerType: { type: String, enum: ['customer', 'worker', 'vendor', 'business_partner'], required: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  balance: { type: Number, default: 0 },
  totalCredit: { type: Number, default: 0 },
  totalDebit: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['credit', 'debit'] },
    amount: Number,
    description: String,
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

walletSchema.index({ ownerType: 1, ownerId: 1 })

module.exports = mongoose.model('Wallet', walletSchema)
