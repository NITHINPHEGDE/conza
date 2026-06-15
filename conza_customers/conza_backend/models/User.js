const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Saved Address sub-document ─────────────────────────────────────────────────
const savedAddressSchema = new mongoose.Schema(
  {
    label:     { type: String, required: true, trim: true },
    address:   { type: String, required: true, trim: true },
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
    landmark:  { type: String, default: '', trim: true },
    houseNo:   { type: String, default: '', trim: true },
    building:  { type: String, default: '', trim: true },
    street:    { type: String, default: '', trim: true },
    area:      { type: String, default: '', trim: true },
    city:      { type: String, default: '', trim: true },
    district:  { type: String, default: '', trim: true },
    state:     { type: String, default: '', trim: true },
    pincode:   { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    username: {
      type: String, required: true, unique: true, trim: true, lowercase: true,
    },

    phone: { type: String, required: true, unique: true, trim: true },

    email: {
      type: String, unique: true, sparse: true, trim: true, lowercase: true,
    },

    password: { type: String, required: true, minlength: 6 },

    profileImage: { type: String, default: null },

    locationText: { type: String, default: '' },

    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },   // [lng, lat]
    },

    locationUpdatedAt: { type: Date, default: null },

    savedWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],

    // ── Saved Addresses ──────────────────────────────────────────────────────
    savedAddresses: {
      type:    [savedAddressSchema],
      default: [],
    },

    memberSince: {
      type: String,
      default: () =>
        new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
