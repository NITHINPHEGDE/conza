// conzacsb/models/SellerOrder.js
const mongoose = require('mongoose');

const sellerOrderSchema = new mongoose.Schema(
  {
    seller:   { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

    orderType: { type: String, enum: ['material', 'rental'], required: true },

    items: [
      {
        product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title:      String,
        image:      String,
        price:      Number,
        unit:       String,
        qty:        Number,
        days:       { type: Number, default: null },   // rental only
        subtotal:   Number,
      },
    ],

    // Customer snapshot
    customerName:    { type: String, default: '' },
    customerPhone:   { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    city:            { type: String, default: '' },
    pincode:         { type: String, default: '' },
    latitude:        { type: Number, default: null },
    longitude:       { type: Number, default: null },

    // Rental dates
    startDate:    { type: Date, default: null },
    endDate:      { type: Date, default: null },
    durationDays: { type: Number, default: null },

    subtotal:      { type: Number, required: true },
    deliveryCharge:{ type: Number, default: 0 },
    total:         { type: Number, required: true },

    depositAmount: { type: Number, default: 0 },
    depositStatus: {
      type: String,
      enum: ['pending', 'collected', 'refunded'],
      default: 'pending',
    },

    paymentMethod: { type: String, enum: ['cod', 'upi', 'online'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },

    // Material statuses: new → accepted → out_for_delivery → delivered | cancelled
    // Rental statuses:   new → active → returned | overdue | cancelled
    status: {
      type: String,
      enum: ['new', 'accepted', 'out_for_delivery', 'delivered', 'active', 'overdue', 'returned', 'cancelled'],
      default: 'new',
    },

    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// getSellerOrders: seller + status + type filter, sorted newest first
sellerOrderSchema.index({ seller: 1, status: 1, createdAt: -1 });

// getDashboard revenue aggregates: seller + status + createdAt range
sellerOrderSchema.index({ seller: 1, status: 1, orderType: 1, createdAt: -1 });

// getDashboard recent material/rental orders
sellerOrderSchema.index({ seller: 1, orderType: 1, createdAt: -1 });

// getMyOrders (customer): customer sorted newest first
sellerOrderSchema.index({ customer: 1, createdAt: -1 });

// base
sellerOrderSchema.index({ seller: 1, createdAt: -1 });
sellerOrderSchema.index({ customer: 1 });

module.exports = mongoose.model('SellerOrder', sellerOrderSchema);