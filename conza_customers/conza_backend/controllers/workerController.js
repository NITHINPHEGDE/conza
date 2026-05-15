const Worker = require('../models/Worker');

// ── GET /api/workers/nearby?category=Plumber&lat=12.9&lng=77.6&radius=5000 ───
const getNearbyWorkers = async (req, res) => {
  try {
    const { category, lat, lng, radius = 50000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const query = {
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),   // metres; 5000 = 5 km
        },
      },
    };

    if (category) query.category = category;

    const workers = await Worker.find(query).select(
      'fullName username profileImage category skills minCharge locationText experience bio isOnline rating totalJobs memberSince location'
    );

    // Calculate distance for each worker (straight-line km)
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const workersWithDistance = workers.map((w) => {
      const [wLng, wLat] = w.location.coordinates;
      const R = 6371; // Earth radius km
      const dLat = ((wLat - userLat) * Math.PI) / 180;
      const dLng = ((wLng - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((wLat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const distKm = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);

      return {
        id:           w._id,
        _id:          w._id,
        name:         w.fullName,
        initials:     w.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
        category:     w.category,
        skills:       w.skills,
        pricePerDay:  w.minCharge || 0,
        minCharge:    w.minCharge,
        rating:       w.rating,
        totalJobs:    w.totalJobs,
        distance:     `${distKm} km away`,
        distanceKm:   parseFloat(distKm),
        available:    w.isOnline,
        isOnline:     w.isOnline,
        bio:          w.bio,
        experience:   w.experience,
        locationText: w.locationText,
        memberSince:  w.memberSince,
        profileImage: w.profileImage,
      };
    });

    // Sort nearest first
    workersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, count: workersWithDistance.length, workers: workersWithDistance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/workers/categories — return category list with counts ─────────────
const getCategories = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // Static emoji map
    const emojiMap = {
      Plumber:     '🔧',
      Carpenter:   '🪚',
      Mason:       '🧱',
      Electrician: '⚡',
      Painter:     '🎨',
      Builder:     '🏗️',
    };

    // If user location provided, count nearby workers per category
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      const RADIUS = 10000; // 10 km for category counts
      const pipeline = [
        {
          $geoNear: {
            near:          { type: 'Point', coordinates: [parsedLng, parsedLat] },
            distanceField: 'dist',
            maxDistance:   RADIUS,
            spherical:     true,
          },
        },
        { $match: { isOnline: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      ];

      const results = await Worker.aggregate(pipeline);

      const categories = Object.keys(emojiMap).map((label) => {
        const found = results.find((r) => r._id === label);
        return {
          id:        label.toLowerCase(),
          label,
          emoji:     emojiMap[label],
          available: found ? found.count : 0,
          rating:    found ? parseFloat(found.avgRating.toFixed(1)) : 0,
        };
      });

      return res.json({ success: true, categories });
    }

    // No location: return static list
    const categories = Object.keys(emojiMap).map((label, i) => ({
      id:    String(i + 1),
      label,
      emoji: emojiMap[label],
      available: 0,
      rating: 0,
    }));

    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/workers/search?q=pipe fitting&lat=12.9&lng=77.6 ─────────────────
const searchWorkers = async (req, res) => {
  try {
    const { q, lat, lng, radius = 10000 } = req.query;
    if (!q) return res.json({ success: true, workers: [] });

    const regex = new RegExp(q, 'i');
    const filter = {
      $or: [
        { fullName: regex },
        { category: regex },
        { skills:   regex },
        { bio:      regex },
      ],
    };

    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const workers = await Worker.find(filter).limit(20).select(
      'fullName username profileImage category skills minCharge locationText isOnline rating totalJobs memberSince location'
    );

    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const mapped = workers.map((w) => {
      let distanceKm = null;
      if (userLat && userLng) {
        const [wLng, wLat] = w.location.coordinates;
        const R = 6371;
        const dLat = ((wLat - userLat) * Math.PI) / 180;
        const dLng = ((wLng - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((wLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        distanceKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
      }
      return {
        id:          w._id,
        _id:         w._id,
        name:        w.fullName,
        initials:    w.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
        category:    w.category,
        skills:      w.skills,
        pricePerDay: w.minCharge || 0,
        rating:      w.rating,
        totalJobs:   w.totalJobs,
        distance:    distanceKm ? `${distanceKm} km away` : '',
        distanceKm,
        available:   w.isOnline,
        isOnline:    w.isOnline,
        locationText: w.locationText,
        memberSince: w.memberSince,
        profileImage: w.profileImage,
      };
    });

    res.json({ success: true, workers: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getNearbyWorkers, getCategories, searchWorkers };