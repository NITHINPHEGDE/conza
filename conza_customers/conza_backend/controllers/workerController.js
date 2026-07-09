// conza_backend/controllers/workerController.js
const Worker             = require('../models/Worker');
const ServiceCategory    = require('../models/ServiceCategory');
const { withCache }      = require('../utils/cacheHelpers');

// ── Coordinate rounding helper (groups nearby users into same bucket) ─────────
const round3 = (n) => Math.round(parseFloat(n) * 1000) / 1000;

// Category names must match tolerantly (case/whitespace) — the app sends
// whatever string it has on hand, and it must still match the worker's
// stored category even if casing or stray spaces differ slightly.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const categoryMatcher = (category) =>
  category ? { $regex: `^${escapeRegex(category.trim())}$`, $options: 'i' } : undefined;

// ── GET /api/workers/nearby ────────────────────────────────────────────────────
const getNearbyWorkers = async (req, res) => {
  try {
    const { category, lat, lng, debug } = req.query;

    // ── DIAGNOSTIC MODE — bypasses Redis, tests exact geo-filter live ──────
    // GET /api/workers/nearby?category=Plumber&lat=12.97&lng=77.49&debug=1
    if (debug) {
      const query = {};
      if (category) query.category = categoryMatcher(category);
      const workers = await Worker.find(query).lean();
      const serviceCategories = await ServiceCategory.find({ active: true }).select('name radius').lean();

      // Build both maps so we can show what the lookup would find
      const radiusMapExact = serviceCategories.reduce((acc, sc) => { acc[sc.name] = sc.radius; return acc; }, {});
      const radiusMapLower = serviceCategories.reduce((acc, sc) => { acc[sc.name.toLowerCase().trim()] = sc.radius; return acc; }, {});

      const parsedLat = lat ? parseFloat(lat) : null;
      const parsedLng = lng ? parseFloat(lng) : null;

      const report = workers.map((w) => {
        const reasons = [];
        if (w.isAvailable === false)  reasons.push('isAvailable is false');
        if (w.status === 'suspended') reasons.push('status is suspended');
        if (w.isVerified !== true)    reasons.push(`isVerified=${w.isVerified} (needs true)`);

        const [wLng, wLat] = w.location?.coordinates || [0, 0];
        if (wLng === 0 && wLat === 0) reasons.push('location is [0,0]');

        const key = (w.category || '').toLowerCase().trim();
        const maxKmExact = radiusMapExact[w.category];
        const maxKmLower = radiusMapLower[key];

        if (maxKmLower === undefined) {
          reasons.push(`NO ServiceCategory radius for "${w.category}" (exact lookup=${maxKmExact}, lower lookup=${maxKmLower})`);
        } else if (maxKmLower === 0 || maxKmLower === null) {
          reasons.push(`ServiceCategory radius is ${maxKmLower} — must be > 0`);
        }

        let distKm = null;
        if (parsedLat !== null && parsedLng !== null && !(wLng === 0 && wLat === 0) && maxKmLower > 0) {
          const R    = 6371;
          const dLat = ((wLat - parsedLat) * Math.PI) / 180;
          const dLng = ((wLng - parsedLng) * Math.PI) / 180;
          const a    = Math.sin(dLat / 2) ** 2 + Math.cos((parsedLat * Math.PI) / 180) * Math.cos((wLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          distKm     = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(3));
          if (distKm > maxKmLower) reasons.push(`TOO FAR: ${distKm}km > radius ${maxKmLower}km`);
        }

        return {
          name: w.fullName,
          category: w.category,
          isAvailable: w.isAvailable, isVerified: w.isVerified, status: w.status,
          location: w.location?.coordinates,
          serviceRadius_km: maxKmLower,
          distanceFromCustomer_km: distKm,
          wouldShow: reasons.length === 0,
          reasons,
        };
      });

      return res.json({
        success: true, debug: true,
        customer: { lat: parsedLat, lng: parsedLng },
        serviceCategories: serviceCategories.map((sc) => ({ name: sc.name, radius_km: sc.radius })),
        workerCount: workers.length, report,
      });
    }

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
      // Match active workers OR legacy documents that predate the status/isVerified
      // fields (no field at all in MongoDB). Only hard-exclude 'suspended'.
      const safeQuery = {
        isAvailable: { $ne: false },
        status:      { $not: { $eq: 'suspended' } },
        // Strict verification gate — a worker only appears to customers once
        // the admin panel has explicitly verified them. Do NOT grandfather in
        // documents missing the field; that loophole let unverified workers
        // through.
        isVerified:  true,
      };
      if (category) safeQuery.category = categoryMatcher(category);
      const workers = await Worker.find(safeQuery).select(
        'fullName username profileImage category skills minCharge baseCharge perDayCharge locationText experience bio isOnline rating totalJobs memberSince location'
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
        baseCharge:   w.baseCharge,
        perDayCharge: w.perDayCharge,
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
      const query = {
        isAvailable: { $ne: false },
        status:      { $not: { $eq: 'suspended' } },
        // Strict verification gate — a worker only appears to customers once
        // the admin panel has explicitly verified them. Do NOT grandfather in
        // documents missing the field; that loophole let unverified workers
        // through.
        isVerified:  true,
      };
      if (category) query.category = categoryMatcher(category);

      const [workers, serviceCategories] = await Promise.all([
        Worker.find(query).select(
          'fullName username profileImage category skills minCharge baseCharge perDayCharge locationText experience bio isOnline rating totalJobs memberSince location'
        ).lean(),
        ServiceCategory.find({ active: true }).select('name radius').lean(),
      ]);

      // Build a case-insensitive map so that a worker whose stored category
      // is "plumber" still matches a ServiceCategory named "Plumber" (or any
      // other casing combination). Without this the radius lookup returns
      // undefined → worker is silently filtered out.
      const categoryRadiusKm = serviceCategories.reduce((acc, sc) => {
        acc[sc.name.toLowerCase().trim()] = sc.radius;
        return acc;
      }, {});

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const mapped = workers
        .map((w) => {
          const [wLng, wLat] = w.location?.coordinates || [0, 0];
          if (wLng === 0 && wLat === 0) return null;
          // Visibility radius is the admin-configured value for this worker's
          // category. If the category has no active ServiceCategory entry,
          // the worker is not shown (misconfiguration on the admin side).
          const maxKm = categoryRadiusKm[w.category?.toLowerCase?.()?.trim?.() ?? ''];
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
            baseCharge:   w.baseCharge,
            perDayCharge: w.perDayCharge,
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
          Worker.find({
            isAvailable: { $ne: false },
            status:      { $not: { $eq: 'suspended' } },
            $or:         [{ isVerified: true }, { isVerified: { $exists: false } }],
          }).select('category rating location').lean(),
        ]);

        // Case-insensitive map — see comment in getNearbyWorkers above.
        const categoryRadiusKm = serviceCategories.reduce((acc, sc) => {
          acc[sc.name.toLowerCase().trim()] = sc.radius;
          return acc;
        }, {});

        const withinRadius = workers.filter((w) => {
          const [wLng, wLat] = w.location.coordinates;
          if (wLng === 0 && wLat === 0) return false;
          const maxKm = categoryRadiusKm[w.category?.toLowerCase?.()?.trim?.() ?? ''];
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
          const matching = withinRadius.filter((w) => w.category?.toLowerCase?.()?.trim?.() === sc.name.toLowerCase().trim());
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
        status:      { $not: { $eq: 'suspended' } },
        // Strict verification gate — a worker only appears to customers once
        // the admin panel has explicitly verified them. Do NOT grandfather in
        // documents missing the field; that loophole let unverified workers
        // through.
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
        .select('fullName username profileImage category skills minCharge baseCharge perDayCharge locationText isOnline rating totalJobs memberSince location')
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
          minCharge:    w.minCharge,
          baseCharge:   w.baseCharge,
          perDayCharge: w.perDayCharge,
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