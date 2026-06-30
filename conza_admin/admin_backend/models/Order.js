const mongoose = require('mongoose')
const customersDB = require('../config/customersDb')

// Reads from the real 'sellerorders' collection in the customers MongoDB.
// Field names mirror conza_customers/conza_backend/models/SellerOrder.js.
const orderSchema = new mongoose.Schema({
  seller:   { type: String },   // ObjectId ref to Seller
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },   // ObjectId ref to Customer
  orderType: { type: String, enum: ['material', 'rental'] },
  items: { type: mongoose.Schema.Types.Mixed, default: [] },
  customerName:    { type: String, default: '' },
  customerPhone:   { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  city:    { type: String, default: '' },
  pincode: { type: String, default: '' },
  subtotal:      { type: Number, default: 0 },
  deliveryCharge:{ type: Number, default: 0 },
  total:         { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'cod' },
  paymentStatus: { type: String, default: 'pending' },
  status: {
    type: String,
    enum: ['new', 'accepted', 'out_for_delivery', 'delivered', 'active', 'overdue', 'returned', 'cancelled'],
    default: 'new',
  },
  notes: { type: String, default: '' },
}, { timestamps: true, collection: 'sellerorders', strict: false })

module.exports = customersDB.model('Order', orderSchema)