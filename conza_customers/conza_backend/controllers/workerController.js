// conza_backend/controllers/workerController.js
const Worker             = require('../models/Worker');
const { withCache }      = require('../utils/cacheHelpers');

// ── Coordinate rounding helper (groups nearby users into same bucket) ─────────
const round3 = (n) => Math.round(parseFloat(n) * 1000) / 1000;

// ── GET /api/workers/nearby ────────────────────────────────────────────────────
const getNearbyWorkers = async (req, res) => {
  try {
    const { category, lat, lng, radius = 50000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const rLat = round3(lat);
    const rLng = round3(lng);
    const cat  = category || 'all';
    const cacheKey = `workers:nearby:${cat}:${rLat}:${rLng}:${radius}`;
    const TTL      = 8;

    const workersWithDistance = await withCache(cacheKey, TTL, async () => {
      const query = {
        location: {
          $near: {
            $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
        isAvailable: { $ne: false },
      };
      if (category) query.category = category;

      const workers = await Worker.find(query).select(
        'fullName username profileImage category skills minCharge locationText experience bio isOnline rating totalJobs memberSince location'
      ).lean();

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const mapped = workers.map((w) => {
        const [wLng, wLat] = w.location.coordinates;
        const R    = 6371;
        const dLat = ((wLat - userLat) * Math.PI) / 180;
        const dLng = ((wLng - userLng) * Math.PI) / 180;
        const a    =
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

      mapped.sort((a, b) => a.distanceKm - b.distanceKm);
      return mapped;
    });

    res.json({ success: true, count: workersWithDistance.length, workers: workersWithDistance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/workers/categories ───────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const emojiMap = {
      Plumber:     '🔧',
      Carpenter:   '🪚',
      Mason:       '🧱',
      Electrician: '⚡',
      Painter:     '🎨',
      Builder:     '🏗️',
    };

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      const rLat     = round3(parsedLat);
      const rLng     = round3(parsedLng);
      const cacheKey = `workers:categories:${rLat}:${rLng}`;
      const TTL      = 10;

      const categories = await withCache(cacheKey, TTL, async () => {
        const RADIUS   = 50000;
        const pipeline = [
          {
            $geoNear: {
              near:          { type: 'Point', coordinates: [parsedLng, parsedLat] },
              distanceField: 'dist',
              maxDistance:   RADIUS,
              spherical:     true,
            },
          },
          { $match: { isOnline: true, isAvailable: { $ne: false } } },
          { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
        ];

        const results = await Worker.aggregate(pipeline);

        return Object.keys(emojiMap).map((label) => {
          const found = results.find((r) => r._id === label);
          return {
            id:        label.toLowerCase(),
            label,
            emoji:     emojiMap[label],
            available: found ? found.count : 0,
            rating:    found ? parseFloat(found.avgRating.toFixed(1)) : 0,
          };
        });
      });

      return res.json({ success: true, categories });
    }

    const categories = Object.keys(emojiMap).map((label, i) => ({
      id:        String(i + 1),
      label,
      emoji:     emojiMap[label],
      available: 0,
      rating:    0,
    }));

    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/workers/search ───────────────────────────────────────────────────
// Uses MongoDB $text index for indexed full-text search instead of regex collection scan.
// Simple alphanumeric queries (likely popular category/skill terms) are cached for 30s.
const searchWorkers = async (req, res) => {
  try {
    const { q, lat, lng, radius = 50000 } = req.query;
    if (!q) return res.json({ success: true, workers: [] });

    const isSimpleQuery = q.length <= 30 && /^[\w\s]+$/.test(q);
    const rLat     = lat ? round3(lat) : 'x';
    const rLng     = lng ? round3(lng) : 'x';
    const cacheKey = `workers:search:${q.toLowerCase().trim()}:${rLat}:${rLng}:${radius}`;
    const TTL      = isSimpleQuery ? 30 : 0;

    const doSearch = async () => {
      // $text uses the compound text index on fullName+category+skills+bio
      // Falls back gracefully if text index missing — but add it to Worker model
      const filter = {
        $text:       { $search: q },
        isAvailable: { $ne: false },
      };

      if (lat && lng) {
        filter.location = {
          $near: {
            $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        };
      }

      const workers = await Worker.find(filter)
        .limit(20)
        .select('fullName username profileImage category skills minCharge locationText isOnline rating totalJobs memberSince location')
        .lean();

      const userLat = lat ? parseFloat(lat) : null;
      const userLng = lng ? parseFloat(lng) : null;

      return workers.map((w) => {
        let distanceKm = null;
        if (userLat && userLng) {
          const [wLng, wLat] = w.location.coordinates;
          const R    = 6371;
          const dLat = ((wLat - userLat) * Math.PI) / 180;
          const dLon = ((wLng - userLng) * Math.PI) / 180;
          const a    =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((userLat * Math.PI) / 180) *
              Math.cos((wLat * Math.PI) / 180) *
              Math.sin(dLon / 2) ** 2;
          distanceKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
        }
        return {
          id:           w._id,
          _id:          w._id,
          name:         w.fullName,
          initials:     w.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
          category:     w.category,
          skills:       w.skills,
          pricePerDay:  w.minCharge || 0,
          rating:       w.rating,
          totalJobs:    w.totalJobs,
          distance:     distanceKm ? `${distanceKm} km away` : '',
          distanceKm,
          available:    w.isOnline,
          isOnline:     w.isOnline,
          locationText: w.locationText,
          memberSince:  w.memberSince,
          profileImage: w.profileImage,
        };
      });
    };

    const workers = TTL > 0
      ? await withCache(cacheKey, TTL, doSearch)
      : await doSearch();

    res.json({ success: true, workers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getNearbyWorkers, getCategories, searchWorkers };