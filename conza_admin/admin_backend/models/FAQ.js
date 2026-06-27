const mongoose = require('mongoose')

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required.'],
      trim: true,
      maxlength: [500, 'Question cannot exceed 500 characters.'],
    },
    answer: {
      type: String,
      required: [true, 'Answer is required.'],
      trim: true,
      maxlength: [5000, 'Answer cannot exceed 5000 characters.'],
    },
    appTarget: {
      type: String,
      enum: {
        values: ['customer', 'worker', 'vendor'],
        message: 'appTarget must be customer, worker, or vendor.',
      },
      required: [true, 'appTarget is required.'],
      index: true,
    },
    sectionTitle: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [100, 'Section title cannot exceed 100 characters.'],
    },
    sectionIcon: {
      type: String,
      trim: true,
      default: '❓',
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
)

faqSchema.index({ appTarget: 1, status: 1, order: 1 })

module.exports = mongoose.model('FAQ', faqSchema)
