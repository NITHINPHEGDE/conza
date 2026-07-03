const router = require('express').Router();
const { toggleOnline, updateLocation, updateProfileImage, getUploadSignature, updateProfile, getCategories } = require('../controllers/workerController');
const { protect, requireActive } = require('../middleware/auth');
const { locationRules }  = require('../validators/workerValidators');
const { upload }         = require('../config/cloudinary');

router.get('/upload-signature', getUploadSignature);
router.get('/categories',       getCategories);

// All routes below require authentication
router.use(protect);
// Suspended workers cannot perform any of these actions
router.use(requireActive);

router.patch('/toggle-online',  toggleOnline);
router.patch('/location',       locationRules, updateLocation);
router.patch('/profile-image',  upload.single('image'), updateProfileImage);
router.patch('/profile',        updateProfile);
router.patch('/push-token', async (req, res) => {
  try {
    const { pushToken } = req.body;
    await require('../models/Worker').findByIdAndUpdate(
      req.worker._id,
      { pushToken },
      { new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
