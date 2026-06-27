const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { invalidateCache } = require('../utils/cacheHelpers');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const generateToken = (id) => {
  let exp = process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '30d';
  if (typeof exp !== 'string' || !exp.trim() || exp === 'undefined' || exp === 'null') {
    exp = '30d';
  }
  return jwt.sign({ id }, process.env.JWT_SECRET || 'conza_jwt_secret_fallback_2026', { expiresIn: exp });
};

// ── POST /api/auth/signup ──────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { fullName, username, phone, email, password, latitude, longitude, locationText } = req.body;

    if (!fullName || !username || !phone || !password) {
      return res.status(400).json({ success: false, message: 'fullName, username, phone, and password are required' });
    }

    const existing = await User.findOne({
      $or: [{ phone }, { username: username.toLowerCase() }],
    }).lean();

    if (existing) {
      if (existing.phone === phone)
        return res.status(400).json({ success: false, message: 'Phone number already registered' });
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

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
        _id:            user._id,
        fullName:       user.fullName,
        username:       user.username,
        phone:          user.phone,
        email:          user.email,
        locationText:   user.locationText,
        memberSince:    user.memberSince,
        profileImage:   user.profileImage,
        location:       user.location,
        savedAddresses: user.savedAddresses,
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
        _id:            user._id,
        fullName:       user.fullName,
        username:       user.username,
        phone:          user.phone,
        email:          user.email,
        locationText:   user.locationText,
        memberSince:    user.memberSince,
        profileImage:   user.profileImage,
        location:       user.location,
        savedAddresses: user.savedAddresses,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const Booking = require('../models/Booking');

    const [user, bookingsCount, activeBookings] = await Promise.all([
      User.findById(req.user._id)
        .select('-password')
        .populate('savedWorkers', 'fullName category rating minCharge profileImage'),
      Booking.countDocuments({ user: req.user._id, status: 'completed' }),
      Booking.countDocuments({
        user: req.user._id,
        status: { $in: ['pending', 'accepted', 'arrived', 'in_progress'] },
      }),
    ]);

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

    // Bust user session cache so next auth request reads updated data
    await invalidateCache(`user:session:${req.user._id}`);

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/reverse-geocode ─────────────────────────────────────────────
const reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const apiKey = process.env.MAPPLS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Mappls API key missing on server' });
    }

    const url = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/rev_geocode?lat=${lat}&lng=${lng}&region=IND`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const r = data.results[0];

      const houseNumber = r.houseNumber || '';
      const houseName   = r.houseName   || '';
      const street      = r.street      || '';
      const area        = r.subLocality || r.locality || '';
      const city        = r.city        || r.district || '';
      const district    = r.district    || '';
      const state       = r.state       || '';
      const pincode     = r.pincode     || '';

      const fullAddress = [houseNumber, houseName, street, area]
        .filter(Boolean)
        .join(', ');

      const locationText = [area, city, state].filter(Boolean).join(', ');

      res.json({
        success: true,
        locationText,
        address: {
          houseNumber,
          houseName,
          street,
          area,
          city,
          district,
          state,
          pincode,
          fullAddress,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'Address not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/addresses ────────────────────────────────────────────────────
const getSavedAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedAddresses').lean();
    res.json({ success: true, addresses: user.savedAddresses || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/addresses ───────────────────────────────────────────────────
const addSavedAddress = async (req, res) => {
  try {
    const { label, address, latitude, longitude, landmark, houseNo, building, street, area, city, district, state, pincode } = req.body;

    if (!label || !address || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'label, address, latitude and longitude are required',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          savedAddresses: {
            label:     label.trim(),
            address:   address.trim(),
            latitude:  parseFloat(latitude),
            longitude: parseFloat(longitude),
            landmark:  (landmark || '').trim(),
            houseNo:   (houseNo || '').trim(),
            building:  (building || '').trim(),
            street:    (street || '').trim(),
            area:      (area || '').trim(),
            city:      (city || '').trim(),
            district:  (district || '').trim(),
            state:     (state || '').trim(),
            pincode:   (pincode || '').trim(),
          },
        },
      },
      { new: true, runValidators: true }
    ).select('savedAddresses');

    // Bust session cache so getMe returns fresh addresses
    await invalidateCache(`user:session:${req.user._id}`);

    const newAddress = user.savedAddresses[user.savedAddresses.length - 1];
    res.status(201).json({ success: true, address: newAddress, addresses: user.savedAddresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/addresses/:addressId ────────────────────────────────────────
const updateSavedAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, address, latitude, longitude, landmark, houseNo, building, street, area, city, district, state, pincode } = req.body;

    if (!label) {
      return res.status(400).json({ success: false, message: 'label is required' });
    }

    const updateFields = {};
    if (label     != null) updateFields['savedAddresses.$.label']     = label.trim();
    if (address   != null) updateFields['savedAddresses.$.address']   = address.trim();
    if (latitude  != null) updateFields['savedAddresses.$.latitude']  = parseFloat(latitude);
    if (longitude != null) updateFields['savedAddresses.$.longitude'] = parseFloat(longitude);
    if (landmark  != null) updateFields['savedAddresses.$.landmark']  = landmark.trim();
    if (houseNo   != null) updateFields['savedAddresses.$.houseNo']   = houseNo.trim();
    if (building  != null) updateFields['savedAddresses.$.building']  = building.trim();
    if (street    != null) updateFields['savedAddresses.$.street']    = street.trim();
    if (area      != null) updateFields['savedAddresses.$.area']      = area.trim();
    if (city      != null) updateFields['savedAddresses.$.city']      = city.trim();
    if (district  != null) updateFields['savedAddresses.$.district']  = district.trim();
    if (state     != null) updateFields['savedAddresses.$.state']     = state.trim();
    if (pincode   != null) updateFields['savedAddresses.$.pincode']   = pincode.trim();

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, 'savedAddresses._id': addressId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('savedAddresses');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await invalidateCache(`user:session:${req.user._id}`);

    res.json({ success: true, addresses: user.savedAddresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/auth/addresses/:addressId ─────────────────────────────────────
const deleteSavedAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedAddresses: { _id: addressId } } },
      { new: true }
    ).select('savedAddresses');

    await invalidateCache(`user:session:${req.user._id}`);

    res.json({ success: true, addresses: user.savedAddresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  updateLocation,
  updateProfile,
  reverseGeocode,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
};