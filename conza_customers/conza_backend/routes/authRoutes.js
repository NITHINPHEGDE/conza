const express = require('express');
const router  = express.Router();
const {
  signup,
  login,
  getMe,
  updateLocation,
  updateProfile,
  reverseGeocode,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup',          signup);
router.post('/login',           login);
router.get('/me',               protect, getMe);
router.get('/reverse-geocode',  reverseGeocode);
router.put('/update-location',  protect, updateLocation);
router.put('/update-profile',   protect, updateProfile);

// ── Saved Addresses ──────────────────────────────────────────────────────────
router.get   ('/addresses',              protect, getSavedAddresses);
router.post  ('/addresses',              protect, addSavedAddress);
router.put   ('/addresses/:addressId',   protect, updateSavedAddress);
router.delete('/addresses/:addressId',   protect, deleteSavedAddress);

module.exports = router;