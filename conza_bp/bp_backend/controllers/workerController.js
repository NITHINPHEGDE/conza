const asyncHandler  = require('../utils/asyncHandler');
const workerService = require('../services/workerService');
const AppError      = require('../utils/AppError');
const { cloudinary } = require('../config/cloudinary');

// PATCH /api/workers/toggle-online  (protected)
const toggleOnline = asyncHandler(async (req, res) => {
  const worker = await workerService.toggleOnlineStatus(req.worker._id);
  res.status(200).json({ success: true, isOnline: worker.isOnline, worker });
});

// PATCH /api/workers/location  (protected)
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

// PATCH /api/workers/profile-image  (protected)
// Expects multipart/form-data with field "image" (handled by multer/cloudinary)
const updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.path) {
    throw new AppError('No image file provided.', 400);
  }
  const worker = await workerService.updateProfileImage(req.worker._id, req.file.path);
  res.status(200).json({ success: true, profileImage: worker.profileImage, worker });
});

// GET /api/workers/upload-signature  (protected)
const getUploadSignature = asyncHandler(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder    = 'conza_partners';

  // Debug: Log params being signed
  console.log('[Cloudinary Debug] Generating signature for:', { timestamp, folder });
  console.log('[Cloudinary Debug] Secret exists:', !!process.env.CLOUDINARY_API_SECRET);

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

module.exports = { toggleOnline, updateLocation, updateProfileImage, getUploadSignature };
