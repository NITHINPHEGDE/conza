// conzasb/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const {
  register, login, getMe, updateProfile, savePushToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register',       register);
router.post('/login',          login);
router.get('/me',              protect, getMe);
router.put('/update-profile',  protect, updateProfile);
router.patch('/push-token',    protect, savePushToken);

module.exports = router;