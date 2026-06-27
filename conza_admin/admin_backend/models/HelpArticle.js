const mongoose = require('mongoose')

const helpArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters.'],
    },
    content: {
      type: String,
      required: [true, 'Content is required.'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters.'],
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
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'draft',
    },
    order: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

helpArticleSchema.index({ appTarget: 1, status: 1, order: 1 })

module.exports = mongoose.model('HelpArticle', helpArticleSchema)
