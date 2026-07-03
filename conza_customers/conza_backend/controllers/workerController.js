// conza_backend/controllers/workerController.js
const Worker             = require('../models/Worker');
const ServiceCategory    = require('../models/ServiceCategory');
const { withCache }      = require('../utils/cacheHelpers');

// ── Coordinate rounding helper (groups nearby users into same bucket) ─────────
const round3 = (n) => Math.round(parseFloat(n) * 1000) / 1000;

// ── GET /api/workers/nearby ────────────────────────────────────────────────────
const getNearbyWorkers = async (req, res) => {
  try {
    const { category, lat, lng } = req.query;

    // The category's admin-configured "Service Radius (km)" is the source of
    // truth for how far a worker can be to count as "nearby" for that category.
    // A client-supplied radius is only used as a fallback when no category is given.
    let radius = req.query.radius ? parseInt(req.query.radius) : 5000;
    if (category) {
      const serviceCategory = await ServiceCategory.findOne({ name: category }).select('radius').lean();
      if (serviceCategory && serviceCategory.radius) {
        radius = serviceCategory.radius * 1000; // km → meters
      }
    }

    if (!lat || !lng) {
      const query = { isAvailable: { $ne: false }, status: 'active', isVerified: true };
      if (category) query.category = category;
      const workers = await Worker.find(query).select(
        'fullName username profileImage category skills minCharge locationText experience bio isOnline rating totalJobs memberSince location'
      ).lean();
      const mapped = workers.map((w) => ({
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
        distance:     w.locationText || 'Nearby',
        distanceKm:   null,
        available:    true,
        isOnline:     true,
        bio:          w.bio,
        experience:   w.experience,
        locationText: w.locationText,
        memberSince:  w.memberSince,
        profileImage: w.profileImage,
      }));
      return res.json({ success: true, count: mapped.length, workers: mapped });
    }

    const rLat = round3(lat);
    const rLng = round3(lng);
    const cat  = category || 'all';
    const cacheKey = `workers:nearby:${cat}:${rLat}:${rLng}:${radius}`;
    const TTL      = 8;

    const workersWithDistance = await withCache(cacheKey, TTL, async () => {
      const query = { isAvailable: { $ne: false }, status: 'active', isVerified: true };
      if (category) query.category = category;

      const [workers, serviceCategories] = await Promise.all([
        Worker.find(query).select(
          'fullName username profileImage category skills minCharge locationText experience bio isOnline rating totalJobs memberSince location'
        ).lean(),
        ServiceCategory.find({ active: true }).select('name radius').lean(),
      ]);
      const categoryRadiusKm = serviceCategories.reduce((acc, sc) => {
        acc[sc.name] = sc.radius;
        return acc;
      }, {});

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const mapped = workers
        .map((w) => {
          const [wLng, wLat] = w.location.coordinates;
          if (wLng === 0 && wLat === 0) return null;
          // Visibility radius is the admin-configured value for this
          // worker's category, not an arbitrary client-supplied radius.
          const maxKm = categoryRadiusKm[w.category];
          if (maxKm === undefined) return null;
          const R      = 6371;
          const dLat   = ((wLat - userLat) * Math.PI) / 180;
          const dLng   = ((wLng - userLng) * Math.PI) / 180;
          const a      =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((userLat * Math.PI) / 180) *
              Math.cos((wLat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const distKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
          if (distKm > maxKm) return null;
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
            distanceKm:   distKm,
            available:    true,
            isOnline:     true,
            bio:          w.bio,
            experience:   w.experience,
            locationText: w.locationText,
            memberSince:  w.memberSince,
            profileImage: w.profileImage,
          };
        })
        .filter(Boolean);

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

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      const rLat     = round3(parsedLat);
      const rLng     = round3(parsedLng);
      const cacheKey = `workers:categories:${rLat}:${rLng}`;
      const TTL      = 10;

      const categories = await withCache(cacheKey, TTL, async () => {
        const [serviceCategories, workers] = await Promise.all([
          ServiceCategory.find({ active: true }).select('name image radius').sort({ name: 1 }).lean(),
          Worker.find({ isAvailable: { $ne: false }, status: 'active', isVerified: true }).select('category rating location').lean(),
        ]);

        const categoryRadiusKm = serviceCategories.reduce((acc, sc) => {
          acc[sc.name] = sc.radius;
          return acc;
        }, {});

        const withinRadius = workers.filter((w) => {
          const [wLng, wLat] = w.location.coordinates;
          if (wLng === 0 && wLat === 0) return false;
          const maxKm = categoryRadiusKm[w.category];
          if (maxKm === undefined) return false;
          const R    = 6371;
          const dLat = ((wLat - parsedLat) * Math.PI) / 180;
          const dLng = ((wLng - parsedLng) * Math.PI) / 180;
          const a    =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((parsedLat * Math.PI) / 180) *
              Math.cos((wLat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return distKm <= maxKm;
        });

        return serviceCategories.map((sc) => {
          const matching = withinRadius.filter((w) => w.category === sc.name);
          const avgRating = matching.length
            ? matching.reduce((s, w) => s + w.rating, 0) / matching.length
            : 0;
          return {
            id:        sc._id,
            label:     sc.name,
            image:     sc.image,
            available: matching.length,
            rating:    parseFloat(avgRating.toFixed(1)),
          };
        });
      });

      return res.json({ success: true, categories });
    }

    const serviceCategories = await ServiceCategory.find({ active: true })
      .select('name image')
      .sort({ name: 1 })
      .lean();

    const categories = serviceCategories.map((sc) => ({
      id:        sc._id,
      label:     sc.name,
      image:     sc.image,
      available: 0,
      rating:    0,
    }));

    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/workers/search ───────────────────────────────────────────────────
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
      const filter = {
        $text:       { $search: q },
        isAvailable: { $ne: false },
        status:      'active',
        isVerified:  true,
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