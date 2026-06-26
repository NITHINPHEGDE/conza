const mongoose = require('mongoose')

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  permissions: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

roleSchema.virtual('users', {
  ref: 'Admin',
  localField: 'name',
  foreignField: 'role',
  count: true,
})

module.exports = mongoose.model('Role', roleSchema)