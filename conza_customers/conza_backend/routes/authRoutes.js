const express = require('express');
const router  = express.Router();
const { signup, login, getMe, updateLocation, updateProfile, reverseGeocode } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup',          signup);
router.post('/login',           login);
router.get('/me',               protect, getMe);
router.get('/reverse-geocode',  reverseGeocode);
router.put('/update-location',  protect, updateLocation);
router.put('/update-profile',   protect, updateProfile);

module.exports = router;