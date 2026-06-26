const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  customer: { type: String, required: true },
  customerId: { type: String, required: true },
  vendor: { type: String, required: true },
  vendorId: { type: String, required: true },
  items: { type: mongoose.Schema.Types.Mixed, default: [] },
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'disputed', 'returned'],
    default: 'confirmed',
  },
  paymentMethod: { type: String, default: 'upi' },
  address: { type: String, default: '' },
  dispute: { type: String, default: '' },
  trackingInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)