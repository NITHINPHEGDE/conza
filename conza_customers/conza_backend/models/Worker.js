// ── This is the schema already provided to you in the brief.
// Paste it exactly as-is. ──

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const workerSchema = new mongoose.Schema(
  {
    fullName:  { type: String, required: true, trim: true },
    username:  { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:  { type: String, required: true, minlength: 6 },
    phone:     { type: String, required: true, unique: true, trim: true },
    email:     { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    profileImage: { type: String, default: null },
    category:  {
      type: String, required: true,
      enum: ['Plumber','Carpenter','Mason','Electrician','Painter','Builder'],
    },
    skills:       { type: [String], default: [] },
    minCharge:    { type: Number, default: null },
    locationText: { type: String, default: '' },
    experience:   { type: Number, default: null },
    bio:          { type: String, default: '' },
    isOnline:     { type: Boolean, default: false },
    isAvailable:  { type: Boolean, default: true },   // false while worker has an active job
    lastLocationAt: { type: Date, default: null },
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    rating:    { type: Number, default: 5.0, min: 0, max: 5 },
    totalJobs: { type: Number, default: 0 },
    memberSince: {
      type: String,
      default: () =>
        new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    },
  },
  { timestamps: true }
);

// getNearbyWorkers + $geoNear: geo + availability + category filter
// Only ONE 2dsphere index so $geoNear doesn't get confused
workerSchema.index({ location: '2dsphere', category: 1, isAvailable: 1 });

// getCategories aggregation $match: isOnline + isAvailable
workerSchema.index({ category: 1, isOnline: 1, isAvailable: 1 });

// text search across name/category/skills/bio
workerSchema.index({ fullName: 'text', category: 'text', skills: 'text', bio: 'text' });

// general
workerSchema.index({ category: 1, isAvailable: 1 });

workerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

workerSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Worker', workerSchema);