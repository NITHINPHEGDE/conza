// conzasb/models/Seller.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const sellerSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    phone:     { type: String, required: true, unique: true, trim: true },
    email:     { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    password:  { type: String, required: true, minlength: 6 },

    shopName:  { type: String, required: true, trim: true },
    address:   { type: String, default: '' },
    city:      { type: String, default: '' },
    pincode:   { type: String, default: '' },

    profileImage: { type: String, default: null },

    gstNumber: { type: String, default: '' },
    licenseNo: { type: String, default: '' },

    // 'material' | 'rental' | 'both'
    sellerType: {
      type:    String,
      enum:    ['material', 'rental', 'both'],
      default: 'both',
    },

    walletBalance: { type: Number, default: 0 },
    pushToken:     { type: String, default: null },

    memberSince: {
      type:    String,
      default: () =>
        new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    },
  },
  { timestamps: true }
);

sellerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

sellerSchema.methods.matchPassword = async function (entered) {
  if (!entered || !this.password) return false;
  return bcrypt.compare(String(entered), this.password);
};

module.exports = mongoose.model('Seller', sellerSchema);