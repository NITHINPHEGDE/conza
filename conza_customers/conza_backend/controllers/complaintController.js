const Complaint = require('../models/Complaint');

// @desc    Report an issue (create a complaint)
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res, next) => {
  try {
    const { subject, description, type } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required.' });
    }

    const allowedTypes = ['booking', 'order', 'payment', 'app', 'worker', 'vendor', 'other'];
    const resolvedType = allowedTypes.includes(type) ? type : 'other';

    const complaint = await Complaint.create({
      user: req.user.fullName,
      userId: req.user._id,
      phone: req.user.phone,
      subject: subject.trim(),
      description: description ? String(description).trim() : '',
      type: resolvedType,
    });

    res.status(201).json({
      success: true,
      message: 'Your issue has been reported. Our team will get back to you shortly.',
      complaint,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all issues reported by the logged-in customer
// @route   GET /api/complaints/my
// @access  Private
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, complaints });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single issue reported by the logged-in customer (to check status)
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, userId: req.user._id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }
    res.status(200).json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

module.exports = { createComplaint, getMyComplaints, getComplaintById };
