const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ── POST /api/auth/signup ──────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { fullName, username, phone, email, password, latitude, longitude, locationText } = req.body;

    if (!fullName || !username || !phone || !password) {
      return res.status(400).json({ success: false, message: 'fullName, username, phone, and password are required' });
    }

    // Duplicate checks
    const existingPhone    = await User.findOne({ phone });
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingPhone)    return res.status(400).json({ success: false, message: 'Phone number already registered' });
    if (existingUsername) return res.status(400).json({ success: false, message: 'Username already taken' });

    const coords = (latitude && longitude)
      ? [parseFloat(longitude), parseFloat(latitude)]
      : [0, 0];

    const user = await User.create({
      fullName,
      username,
      phone,
      email: email || undefined,
      password,
      locationText: locationText || '',
      location: { type: 'Point', coordinates: coords },
      locationUpdatedAt: (latitude && longitude) ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: generateToken(user._id),
      user: {
        _id:         user._id,
        fullName:    user.fullName,
        username:    user.username,
        phone:       user.phone,
        email:       user.email,
        locationText: user.locationText,
        memberSince: user.memberSince,
        profileImage: user.profileImage,
        location:    user.location,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id:         user._id,
        fullName:    user.fullName,
        username:    user.username,
        phone:       user.phone,
        email:       user.email,
        locationText: user.locationText,
        memberSince: user.memberSince,
        profileImage: user.profileImage,
        location:    user.location,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('savedWorkers', 'fullName category rating minCharge profileImage');

    const bookingsCount = await require('../models/Booking').countDocuments({
      user: req.user._id, status: 'completed',
    });

    const activeBookings = await require('../models/Booking').countDocuments({
      user: req.user._id, status: { $in: ['pending', 'confirmed', 'in_progress'] },
    });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        projectsCompleted: bookingsCount,
        activeSites:       activeBookings,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/update-location ─────────────────────────────────────────────
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, locationText } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      locationText:      locationText || req.user.locationText,
      locationUpdatedAt: new Date(),
    });

    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/update-profile ──────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, locationText } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, email, locationText },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/reverse-geocode ───────────────────────────────────────────
const reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const apiKey = process.env.OPENCAGE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'OpenCage API key missing on server' });
    }

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const components = data.results[0].components;
      const city    = components.city || components.town || components.village || components.suburb || '';
      const state   = components.state || components.province || '';
      const area    = components.neighbourhood || components.suburb || components.district || '';
      const pincode = components.postcode || '';
      const street  = components.road || '';

      const locationText = [city, state].filter(Boolean).join(', ');
      
      res.json({ 
        success: true, 
        locationText, 
        address: {
          city,
          state,
          area,
          pincode,
          street
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'Address not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { signup, login, getMe, updateLocation, updateProfile, reverseGeocode };