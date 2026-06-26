const mongoose = require('mongoose')

const rentalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendor: { type: String, required: true },
  category: { type: String, required: true },
  pricePerDay: { type: Number, required: true },
  pricePerWeek: { type: Number, default: 0 },
  pricePerMonth: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  description: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Rental', rentalSchema)
