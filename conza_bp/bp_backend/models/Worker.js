const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Each entry is a category this worker registered under, with that
// category's admin-set pricing snapshotted at the time it was added/last
// synced. A worker can belong to any number of categories at once — see
// workerService.resolveCategoriesArray().
const workerCategorySchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    baseCharge:   { type: Number, default: 0 },   // Base Minimum Charge (flat call-out fee)
    minCharge:    { type: Number, default: 0 },   // Per Hour Minimum Charge
    perDayCharge: { type: Number, default: 0 },   // Per Day Charge (multi-day bookings)
  },
  { _id: false }
);

const workerSchema = new mongoose.Schema(
  {
    fullName:     { type: String, required: true, trim: true },
    username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:     { type: String, required: true, minlength: 6 },
    phone:        { type: String, required: true, unique: true, trim: true },
    email:        { type: String, unique: true, sparse: true, trim: true, lowercase: true },

    profileImage: { type: String, default: null },

    // Categories are dynamic — each validated against the ServiceCategory
    // collection in workerService.signUpWorker()/updateWorkerCategories().
    // A worker can hold multiple categories at once (e.g. Plumber +
    // Electrician), each with its own admin-set pricing snapshot.
    categories: {
      type: [workerCategorySchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Worker must have at least one category.',
      },
    },
    skills:       { type: [String], default: [] },
    locationText: { type: String, default: '' },   // human-readable city/area
    experience:   { type: Number, default: null },
    bio:          { type: String, default: '' },

    // ── Online / Offline ───────────────────────────────────────────────────
    isOnline:         { type: Boolean, default: true },
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

    // ── Admin-managed fields (written by conza_admin) ───────────────────────
    // status: controls whether this worker can use the app at all.
    // 'suspended' blocks all protected actions — see middleware/auth.js requireActive.
    status:     { type: String, enum: ['active', 'suspended', 'pending_verification'], default: 'pending_verification' },
    isVerified: { type: Boolean, default: false },

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

// Compound geo index — single 2dsphere field index removed
workerSchema.index({ location: '2dsphere', 'categories.name': 1, isAvailable: 1 });

// category listing + online status
workerSchema.index({ 'categories.name': 1, isOnline: 1, isAvailable: 1 });

// general availability filter
workerSchema.index({ 'categories.name': 1, isAvailable: 1 });

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
