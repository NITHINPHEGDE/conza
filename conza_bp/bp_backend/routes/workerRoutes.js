const router = require('express').Router();
const { toggleOnline, updateLocation, updateProfileImage, getUploadSignature } = require('../controllers/workerController');
const { protect }        = require('../middleware/auth');
const { locationRules }  = require('../validators/workerValidators');
const { upload }         = require('../config/cloudinary');

router.get('/upload-signature', getUploadSignature);

// All routes below require authentication
router.use(protect);

router.patch('/toggle-online',  toggleOnline);
router.patch('/location',       locationRules, updateLocation);
router.patch('/profile-image',  upload.single('image'), updateProfileImage);
router.patch('/push-token', async (req, res) => {
  try {
    const { pushToken } = req.body;
    console.log('[PushToken] Saving token for worker:', req.worker._id, 'token:', pushToken);
    await require('../models/Worker').findByIdAndUpdate(
      req.worker._id,
      { pushToken },
      { new: true }
    );
    console.log('[PushToken] ✅ Saved successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('[PushToken] ❌ Failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
