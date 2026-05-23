// conzasb/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },

    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    brand:       { type: String, default: '' },
    category:    { type: String, required: true },
    unit:        { type: String, default: 'piece' },

    // 'material' | 'rental'
    type:        { type: String, enum: ['material', 'rental'], required: true },

    price:         { type: Number, required: true },  // sale price or per-day rental
    rentalPrice:   { type: Number, default: null },
    deposit:       { type: Number, default: 0 },
    minRentalDays: { type: Number, default: 1 },

    stock:    { type: Number, default: 0 },
    sold:     { type: Number, default: 0 },
    sku:      { type: String, default: '' },
    minOrder: { type: Number, default: 1 },
    weight:   { type: String, default: '' },
    hsnCode:  { type: String, default: '' },

    images:      { type: [String], default: [] },  // Cloudinary URLs
    isAvailable: { type: Boolean, default: true },
    lowStockAt:  { type: Number, default: 5 },
  },
  { timestamps: true }
);

productSchema.index({ seller: 1, type: 1 });
productSchema.index({ type: 1, isAvailable: 1 });
productSchema.index({ title: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);