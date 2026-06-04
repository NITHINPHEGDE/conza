const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const workerSchema = new mongoose.Schema(
  {
    fullName:     { type: String, required: true, trim: true },
    username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:     { type: String, required: true, minlength: 6 },
    phone:        { type: String, required: true, unique: true, trim: true },
    email:        { type: String, unique: true, sparse: true, trim: true, lowercase: true },

    profileImage: { type: String, default: null },

    category:     {
      type: String,
      required: true,
      enum: ['Plumber', 'Carpenter', 'Mason', 'Electrician', 'Painter', 'Builder'],
    },
    skills:       { type: [String], default: [] },
    minCharge:    { type: Number, default: null },
    locationText: { type: String, default: '' },   // human-readable city/area
    experience:   { type: Number, default: null },
    bio:          { type: String, default: '' },

    // ── Online / Offline ───────────────────────────────────────────────────
    isOnline:         { type: Boolean, default: false },
    isAvailable:      { type: Boolean, default: true },   // false while worker has an active job
    lastLocationAt:   { type: Date,    default: null },   // last GPS ping timestamp

    // ── GeoJSON location — updated in-place, no history ───────────────────
    location: {
      type: {
        type:        String,
        enum:        ['Point'],
        default:     'Point',
      },
      coordinates: {
        type:    [Number],     // [longitude, latitude]
        default: [0, 0],
      },
    },

    // ── Stats ──────────────────────────────────────────────────────────────
    pushToken: { type: String, default: null },
    rating:    { type: Number, default: 5.0,  min: 0, max: 5 },
    totalJobs: { type: Number, default: 0 },
    memberSince: {
      type: String,
      default: () =>
        new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    },
  },
  { timestamps: true }
);

// ── 2dsphere index for geospatial queries ──────────────────────────────────
workerSchema.index({ location: '2dsphere' });

// ── Hash password before save ──────────────────────────────────────────────
workerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare password ─────────────────────────────────────
workerSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ── Strip sensitive fields when serialising ────────────────────────────────
workerSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Worker', workerSchema);
