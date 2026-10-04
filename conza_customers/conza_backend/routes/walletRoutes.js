const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User              = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

// GET /api/wallet/balance — returns current wallet balance
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, balance: user.walletBalance ?? 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/transactions — returns transaction ledger history
router.get('/transactions', protect, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      WalletTransaction.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

