// conzasb/middleware/authMiddleware.js
const jwt    = require('jsonwebtoken');
const Seller = require('../models/Seller');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'conza_vendor_jwt_secret_fallback_2026');
    req.seller = await Seller.findById(decoded.id).select('-password');
    if (!req.seller) {
      return res.status(401).json({ success: false, message: 'Seller not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Blocks suspended vendors from using anything except /auth/me (so the app
// can still detect the suspended status and show the notice screen).
const requireActive = (req, res, next) => {
  if (req.seller?.status === 'suspended') {
    return res.status(403).json({
      success: false,
      suspended: true,
      message: 'You have been suspended. Contact nr.conza@gmail.com',
    });
  }
  next();
};

module.exports = { protect, requireActive };