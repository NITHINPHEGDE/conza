// conzasb/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const {
  register, login, getMe, updateProfile, savePushToken, logout,
} = require('../controllers/authController');
const { protect, requireActive } = require('../middleware/authMiddleware');

router.post('/register',       register);
router.post('/login',          login);
router.post('/logout',         protect, logout);
router.get('/me',              protect, getMe);
router.put('/update-profile',  protect, requireActive, updateProfile);
router.patch('/push-token',    protect, requireActive, savePushToken);

module.exports = router;