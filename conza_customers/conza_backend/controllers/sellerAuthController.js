// conzacsb/controllers/sellerAuthController.js
const jwt    = require('jsonwebtoken');
const Seller = require('../models/Seller');

const generateToken = (id) =>
  jwt.sign({ id, role: 'seller' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const sellerPublic = (s) => ({
  _id:          s._id,
  name:         s.name,
  phone:        s.phone,
  email:        s.email,
  shopName:     s.shopName,
  address:      s.address,
  city:         s.city,
  pincode:      s.pincode,
  profileImage: s.profileImage,
  sellerType:   s.sellerType,
  walletBalance:s.walletBalance,
  gstNumber:    s.gstNumber,
  licenseNo:    s.licenseNo,
  memberSince:  s.memberSince,
});

// POST /api/seller/auth/register
const register = async (req, res) => {
  try {
    const { name, phone, email, password, shopName, address, city, pincode, sellerType } = req.body;

    if (!name || !phone || !password || !shopName) {
      return res.status(400).json({ success: false, message: 'name, phone, password, shopName are required' });
    }

    const existing = await Seller.findOne({ phone });
    if (existing) return res.status(400).json({ success: false, message: 'Phone already registered' });

    if (email) {
      const existingEmail = await Seller.findOne({ email: email.toLowerCase() });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const seller = await Seller.create({
      name, phone, email: email || undefined,
      password, shopName,
      address: address || '',
      city: city || '',
      pincode: pincode || '',
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

// POST /api/seller/auth/login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'phone and password are required' });
    }
    const seller = await Seller.findOne({ phone });
    if (!seller || !(await seller.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({
      success: true,
      token:  generateToken(seller._id),
      seller: sellerPublic(seller),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/seller/auth/me
const getMe = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id).select('-password');
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

    const revenue = revenueAgg[0]?.total || 0;

    res.json({
      success: true,
      seller: { ...sellerPublic(seller), totalProducts, totalOrders, pendingOrders, revenue },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/seller/auth/update-profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, shopName, address, city, pincode, sellerType, gstNumber, licenseNo } = req.body;
    const seller = await Seller.findByIdAndUpdate(
      req.seller._id,
      { name, email, shopName, address, city, pincode, sellerType, gstNumber, licenseNo },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, seller: sellerPublic(seller) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/seller/auth/push-token
const savePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    await Seller.findByIdAndUpdate(req.seller._id, { pushToken });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, savePushToken };