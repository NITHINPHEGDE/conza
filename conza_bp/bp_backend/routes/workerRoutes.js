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

module.exports = router;
