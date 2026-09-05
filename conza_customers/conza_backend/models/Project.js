const mongoose = require('mongoose');

// A customer-created project groups their ongoing labour bookings and
// material/rental orders under one named umbrella so progress can be
// tracked as a single combined status instead of checking each one
// separately (see controllers/projectController.js for the status logic).
const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    budget:      { type: Number, default: 0 },
    location:    { type: String, default: 'Bengaluru, Karnataka', trim: true },
    image:       { type: String, default: '' },
    customStatus:{ type: String, default: 'in_progress' },

    expenses: [
      {
        title:    { type: String, required: true },
        amount:   { type: Number, required: true },
        category: { type: String, default: 'General' },
        date:     { type: Date, default: Date.now },
      },
    ],

    attachments: [
      {
        refModel: { type: String, enum: ['Booking', 'SellerOrder'], required: true },
        refId:    { type: mongoose.Schema.Types.ObjectId, required: true },
        addedAt:  { type: Date, default: Date.now },
      },
    ],

    // Cached combined status, recomputed from live attachment statuses
    // every time the project is read (getMyProjects / getProjectById) or
    // its attachments change.
    status: {
      type: String,
      enum: ['no_attachments', 'in_progress', 'completed', 'cancelled'],
      default: 'no_attachments',
    },
  },
  { timestamps: true }
);

projectSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
