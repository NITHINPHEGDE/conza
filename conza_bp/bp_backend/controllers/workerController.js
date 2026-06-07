const asyncHandler   = require('../utils/asyncHandler');
const workerService  = require('../services/workerService');
const AppError       = require('../utils/AppError');
const { cloudinary } = require('../config/cloudinary');
const logger         = require('../utils/logger');

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

module.exports = { toggleOnline, updateLocation, updateProfileImage, getUploadSignature };