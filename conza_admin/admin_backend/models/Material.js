const mongoose = require('mongoose')

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendor: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, default: 'piece' },
  stock: { type: Number, default: 0 },
  threshold: { type: Number, default: 5 },
  images: { type: [String], default: [] },
  description: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Material', materialSchema)
