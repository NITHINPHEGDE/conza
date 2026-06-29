const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User     = require('../models/User');

// GET /api/wallet/balance  — returns current wallet balance
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, balance: user.walletBalance ?? 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
