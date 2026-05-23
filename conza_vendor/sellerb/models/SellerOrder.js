// conzasb/models/SellerOrder.js
const mongoose = require('mongoose');

const sellerOrderSchema = new mongoose.Schema(
  {
    seller:   { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },

    // customer info — filled from the customer's JWT / profile at order placement
    customerId:      { type: String, default: '' },  // User._id from customer backend
    customerName:    { type: String, default: '' },
    customerPhone:   { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    city:            { type: String, default: '' },
    pincode:         { type: String, default: '' },
    latitude:        { type: Number, default: null },
    longitude:       { type: Number, default: null },

    // 'material' | 'rental'
    orderType: { type: String, enum: ['material', 'rental'], required: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title:     String,
        image:     { type: String, default: null },
        price:     Number,
        unit:      String,
        qty:       Number,
        days:      { type: Number, default: null },   // rental only
        subtotal:  Number,
      },
    ],

    // rental dates
    startDate:    { type: Date,   default: null },
    endDate:      { type: Date,   default: null },
    durationDays: { type: Number, default: null },

    subtotal:       { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    total:          { type: Number, required: true },

    depositAmount: { type: Number, default: 0 },
    depositStatus: {
      type:    String,
      enum:    ['pending', 'collected', 'refunded'],
      default: 'pending',
    },

    paymentMethod: {
      type:    String,
      enum:    ['cod', 'upi', 'online'],
      default: 'cod',
    },
    paymentStatus: {
      type:    String,
      enum:    ['pending', 'paid', 'refunded'],
      default: 'pending',
    },

    // material: new → accepted → out_for_delivery → delivered | cancelled
    // rental:   new → active → returned | overdue | cancelled
    status: {
      type:    String,
      enum:    ['new', 'accepted', 'out_for_delivery', 'delivered', 'active', 'overdue', 'returned', 'cancelled'],
      default: 'new',
    },

    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

sellerOrderSchema.index({ seller: 1, status: 1 });
sellerOrderSchema.index({ seller: 1, createdAt: -1 });
sellerOrderSchema.index({ customerId: 1 });

module.exports = mongoose.model('SellerOrder', sellerOrderSchema);