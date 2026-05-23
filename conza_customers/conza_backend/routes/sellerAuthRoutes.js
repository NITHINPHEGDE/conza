// conzacsb/routes/sellerAuthRoutes.js
const express = require('express');
const router  = express.Router();
const { register, login, getMe, updateProfile, savePushToken } = require('../controllers/sellerAuthController');
const { protectSeller } = require('../middleware/sellerAuthMiddleware');

router.post('/register',      register);
router.post('/login',         login);
router.get('/me',             protectSeller, getMe);
router.put('/update-profile', protectSeller, updateProfile);
router.patch('/push-token',   protectSeller, savePushToken);

module.exports = router;