const mongoose = require('mongoose')

const contentSchema = new mongoose.Schema({
  type: { type: String, enum: ['faq', 'terms', 'privacy', 'about', 'help', 'banner'], required: true },
  appTarget: { type: String, enum: ['customer', 'worker', 'vendor', 'all'], default: 'all', index: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  status: { type: String, enum: ['published', 'draft', 'archived'], default: 'draft' },
  order: { type: Number, default: 0 },
  image: { type: String, default: '' },
  link: { type: String, default: '' },
  position: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: { type: [String], default: [] },
}, { timestamps: true })

module.exports = mongoose.model('Content', contentSchema)
