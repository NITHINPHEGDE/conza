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
const { protect, checkSuspended } = require('../middleware/authMiddleware');

router.post('/signup',          signup);
router.post('/login',           login);
router.get('/me',               protect, getMe);
router.get('/reverse-geocode',  reverseGeocode);
router.put('/update-location',  protect, checkSuspended, updateLocation);
router.put('/update-profile',   protect, checkSuspended, updateProfile);

// ── Saved Addresses ──────────────────────────────────────────────────────────
router.get   ('/addresses',              protect, getSavedAddresses);
router.post  ('/addresses',              protect, checkSuspended, addSavedAddress);
router.put   ('/addresses/:addressId',   protect, checkSuspended, updateSavedAddress);
router.delete('/addresses/:addressId',   protect, checkSuspended, deleteSavedAddress);

module.exports = router;