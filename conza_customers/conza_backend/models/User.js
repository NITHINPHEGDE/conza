const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

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