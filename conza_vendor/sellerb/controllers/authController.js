// conzasb/controllers/authController.js
const { signToken } = require('../utils/jwt');
const Seller = require('../models/Seller');

const generateToken = (id) => signToken({ id });

const sellerPublic = (s) => ({
  _id:           s._id,
  name:          s.name,
  phone:         s.phone,
  email:         s.email,
  shopName:      s.shopName,
  address:       s.address,
  city:          s.city,
  pincode:       s.pincode,
  profileImage:  s.profileImage,
  sellerType:    s.sellerType,
  walletBalance: s.walletBalance,
  gstNumber:     s.gstNumber,
  licenseNo:     s.licenseNo,
  memberSince:   s.memberSince,
  status:        s.status,
  isVerified:    s.isVerified,
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const {
      name, phone, email, password,
      shopName, address, city, pincode, sellerType,
    } = req.body;

    if (!name || !phone || !password || !shopName) {
      return res.status(400).json({
        success: false,
        message: 'name, phone, password and shopName are required',
      });
    }

    if (await Seller.findOne({ phone })) {
      return res.status(400).json({ success: false, message: 'Phone already registered' });
    }

    if (email && await Seller.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const seller = await Seller.create({
      name,
      phone,
      email:      email      || undefined,
      password,
      shopName,
      address:    address    || '',
      city:       city       || '',
      pincode:    pincode    || '',
      sellerType: sellerType || 'both',
    });

    res.status(201).json({
      success: true,
      message: 'Seller account created',
      token:   generateToken(seller._id),
      seller:  sellerPublic(seller),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'phone and password are required' });
    }

    const cleanPhone = String(phone).trim();
    const seller = await Seller.findOne({ phone: cleanPhone });
    if (!seller || !(await seller.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token:  generateToken(seller._id),
      seller: sellerPublic(seller),
    });
  } catch (err) {
    console.error('Vendor Login Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during login',
      errorType: err.name || 'Error',
    });
  }
};

const { invalidateSellerCache, revokeSellerToken } = require('../middleware/authMiddleware');

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const seller = req.seller;

    const Product     = require('../models/Product');
    const SellerOrder = require('../models/SellerOrder');

    const [totalProducts, totalOrders, pendingOrders, revenueAgg] = await Promise.all([
      Product.countDocuments({ seller: seller._id }),
      SellerOrder.countDocuments({ seller: seller._id }),
      SellerOrder.countDocuments({ seller: seller._id, status: 'new' }),
      SellerOrder.aggregate([
        { $match: { seller: seller._id, status: { $in: ['delivered', 'returned'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    res.json({
      success: true,
      seller: {
        ...sellerPublic(seller),
        totalProducts,
        totalOrders,
        pendingOrders,
        revenue: revenueAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/update-profile ──────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const {
      name, email, shopName, address,
      city, pincode, sellerType, gstNumber, licenseNo,
    } = req.body;

    const seller = await Seller.findByIdAndUpdate(
      req.seller._id,
      { name, email, shopName, address, city, pincode, sellerType, gstNumber, licenseNo },
      { new: true, runValidators: true }
    ).select('-password');

    await invalidateSellerCache(req.seller._id);

    res.json({ success: true, seller: sellerPublic(seller) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/auth/push-token ────────────────────────────────────────────────
const savePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    await Seller.findByIdAndUpdate(req.seller._id, { pushToken });
    await invalidateSellerCache(req.seller._id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      await revokeSellerToken(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, savePushToken, logout };