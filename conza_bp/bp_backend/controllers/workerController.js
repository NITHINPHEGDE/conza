const asyncHandler   = require('../utils/asyncHandler');
const workerService  = require('../services/workerService');
const AppError       = require('../utils/AppError');
const { cloudinary } = require('../config/cloudinary');
const logger         = require('../utils/logger');
const Worker           = require('../models/Worker');
const ServiceCategory  = require('../models/ServiceCategory');

// GET /api/workers/categories — public, used on the sign-up / edit-profile screens
const getCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({ active: true })
    .select('name image commission radius description')
    .sort({ name: 1 })
    .lean();

  res.status(200).json({
    success: true,
    categories: categories.map((c) => ({
      id:    c._id,
      name:  c.name,
      image: c.image,
    })),
  });
});

const toggleOnline = asyncHandler(async (req, res) => {
  const worker = await workerService.toggleOnlineStatus(req.worker._id);
  res.status(200).json({ success: true, isOnline: worker.isOnline, worker });
});

const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  const worker = await workerService.updateWorkerLocation(
    req.worker._id,
    parseFloat(latitude),
    parseFloat(longitude)
  );
  res.status(200).json({
    success: true,
    location: worker.location,
    lastLocationAt: worker.lastLocationAt,
  });
});

const updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.path) {
    throw new AppError('No image file provided.', 400);
  }
  const worker = await workerService.updateProfileImage(req.worker._id, req.file.path);
  res.status(200).json({ success: true, profileImage: worker.profileImage, worker });
});

const getUploadSignature = asyncHandler(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder    = 'conza_partners';

  logger.info({ timestamp, folder }, 'Generating Cloudinary upload signature');

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  res.status(200).json({
    success:    true,
    signature,
    timestamp,
    folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
  });
});

const ALLOWED_PROFILE_FIELDS = [
  'fullName', 'phone', 'email', 'category', 'skills',
  'locationText', 'experience', 'bio', 'profileImage',
];

const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  ALLOWED_PROFILE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update.', 400);
  }

  // Check uniqueness for phone/email if changed
  if (updates.phone || updates.email) {
    const orClauses = [];
    if (updates.phone) orClauses.push({ phone: updates.phone });
    if (updates.email) orClauses.push({ email: updates.email.toLowerCase() });

    const conflict = await Worker.findOne({
      $or: orClauses,
      _id: { $ne: req.worker._id },
    });

    if (conflict) {
      if (updates.phone && conflict.phone === updates.phone)
        throw new AppError('Phone number is already in use.', 400);
      if (updates.email && conflict.email === updates.email.toLowerCase())
        throw new AppError('Email is already in use.', 400);
    }

    if (updates.email) updates.email = updates.email.toLowerCase();
  }

  const worker = await Worker.findByIdAndUpdate(
    req.worker._id,
    { $set: updates },
    { new: true, runValidators: true, select: '-password' }
  );

  if (!worker) throw new AppError('Worker not found.', 404);

  logger.info({ workerId: req.worker._id, fields: Object.keys(updates) }, 'Profile updated');
  res.status(200).json({ success: true, worker });
});

module.exports = { toggleOnline, updateLocation, updateProfileImage, getUploadSignature, updateProfile, getCategories };