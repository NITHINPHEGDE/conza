// conza_backend/controllers/workerController.js
const Worker             = require('../models/Worker');
const ServiceCategory    = require('../models/ServiceCategory');
const { withCache }      = require('../utils/cacheHelpers');

// ── Coordinate rounding helper (groups nearby users into same bucket) ─────────
const round3 = (n) => Math.round(parseFloat(n) * 1000) / 1000;

// ── Distance (km) → ETA (minutes) helper ───────────────────────────────────
// Base rate: 1.5 minutes per km, plus an extra 3 minutes for every full 5km
// travelled (accounts for traffic/stops on longer trips).
const kmToMinutes = (km) => {
  if (km === null || km === undefined || isNaN(km)) return null;
  const base  = km * 1.5;
  const extra = Math.floor(km / 5) * 3;
  return Math.max(1, Math.round(base + extra));
};

// Category names must match tolerantly (case/whitespace) — the app sends
// whatever string it has on hand, and it must still match the worker's
// stored category even if casing or stray spaces differ slightly.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const categoryMatcher = (category) =>
  category ? { $regex: `^${escapeRegex(category.trim())}$`, $options: 'i' } : undefined;

// A worker can belong to several categories, each with its own admin-set
// pricing. Whenever we're returning workers for a SPECIFIC category context
// (the category being browsed / searched), we must resolve pricing from
// that worker's matching entry in `categories[]` — never a flat top-level
// rate, since it no longer exists.
const pickCategoryEntry = (worker, categoryName) => {
  const list = worker.categories || [];
  if (!categoryName) {
    if (list[0]) return list[0];
    if (worker.category) {
      return {
        name: worker.category,
        minCharge: worker.minCharge || 0,
        baseCharge: worker.baseCharge || 0,
        perDayCharge: worker.perDayCharge || 0,
      };
    }
    return null;
  }
  const target = categoryName.trim().toLowerCase();
  const found = list.find((c) => (c.name || '').trim().toLowerCase() === target);
  if (found) return found;
  if ((worker.category || '').trim().toLowerCase() === target) {
    return {
      name: worker.category,
      minCharge: worker.minCharge || 0,
      baseCharge: worker.baseCharge || 0,
      perDayCharge: worker.perDayCharge || 0,
    };
  }
  return list[0] || (worker.category ? {
    name: worker.category,
    minCharge: worker.minCharge || 0,
    baseCharge: worker.baseCharge || 0,
    perDayCharge: worker.perDayCharge || 0,
  } : null);
};

// ── GET /api/workers/nearby ────────────────────────────────────────────────────
const getNearbyWorkers = async (req, res) => {
  try {
    const { category, lat, lng, debug } = req.query;

    // ── DIAGNOSTIC MODE — gated to development/test environments only ──────
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    if (debug && isDev) {
      const query = {};
      if (category) {
        query.$or = [
          { 'categories.name': categoryMatcher(category) },
          { category: categoryMatcher(category) },
        ];
      }
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

        const entry = pickCategoryEntry(w, category);
        const wCategoryName = entry?.name || '';
        const key = wCategoryName.toLowerCase().trim();
        const maxKmExact = radiusMapExact[wCategoryName];
        const maxKmLower = radiusMapLower[key];

        if (maxKmLower === undefined) {
          reasons.push(`NO ServiceCategory radius for "${wCategoryName}" (exact lookup=${maxKmExact}, lower lookup=${maxKmLower})`);
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
          categories: (w.categories || []).map((c) => c.name),
          category: wCategoryName,
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

    // ── Input coordinate and radius validation ──────────────────────────────
    const hasLat = lat !== undefined && lat !== null && String(lat).trim() !== '';
    const hasLng = lng !== undefined && lng !== null && String(lng).trim() !== '';

    if (hasLat || hasLng) {
      if (!hasLat || !hasLng) {
        return res.status(400).json({ success: false, message: 'Both latitude and longitude are required for location-based search.' });
      }
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({ success: false, message: 'Invalid latitude or longitude coordinates.' });
      }
    }

    let clientRadiusMeters = null;
    if (req.query.radius !== undefined && req.query.radius !== null && String(req.query.radius).trim() !== '') {
      const parsedRadius = parseInt(req.query.radius, 10);
      if (isNaN(parsedRadius) || parsedRadius <= 0) {
        return res.status(400).json({ success: false, message: 'Radius must be a positive number.' });
      }
      // Server-controlled ceiling: max 100km (100,000 meters)
      clientRadiusMeters = Math.min(parsedRadius, 100000);
    }

    // ── Fallback when coordinates are omitted ───────────────────────────────
    // Preserves UI compatibility for clients without location permissions,
    // while preventing unbounded memory consumption by capping at 50 results.
    if (!hasLat || !hasLng) {
      const safeQuery = {
        isAvailable: { $ne: false },
        status:      { $not: { $eq: 'suspended' } },
        isVerified:  true,
      };
      if (category) {
        safeQuery.$or = [
          { 'categories.name': categoryMatcher(category) },
          { category: categoryMatcher(category) },
        ];
      }
      const FALLBACK_LIMIT = 50;
      const workers = await Worker.find(safeQuery)
        .sort({ rating: -1, totalJobs: -1 })
        .limit(FALLBACK_LIMIT)
        .select(
          'fullName username profileImage categories category minCharge baseCharge perDayCharge skills locationText experience bio isOnline rating totalJobs memberSince location'
        )
        .lean();

      const mapped = workers.map((w) => {
        const entry = pickCategoryEntry(w, category);
        return {
          id:           w._id,
          _id:          w._id,
          name:         w.fullName,
          initials:     w.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
          category:     entry?.name || '',
          categories:   (w.categories || []).map((c) => c.name),
          skills:       w.skills,
          pricePerDay:  entry?.minCharge || 0,
          minCharge:    entry?.minCharge || 0,
          baseCharge:   entry?.baseCharge || 0,
          perDayCharge: entry?.perDayCharge || 0,
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
        };
      });
      return res.json({ success: true, count: mapped.length, workers: mapped });
    }

    // ── Geospatial location search ───────────────────────────────────────────
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const EARTH_RADIUS_KM = 6371;
    const R = EARTH_RADIUS_KM;

    const baseFilter = {
      isAvailable: { $ne: false },
      status:      { $not: { $eq: 'suspended' } },
      isVerified:  true,
    };

    // ── Case A: Category is specified ───────────────────────────────────────
    // Consolidates to 1 ServiceCategory query + 1 Worker query
    if (category) {
      const serviceCategory = await ServiceCategory.findOne({
        active: true,
        name: categoryMatcher(category),
      }).select('name radius').lean();

      if (!serviceCategory) {
        return res.json({ success: true, count: 0, workers: [] });
      }

      const scName = serviceCategory.name;
      const radiusKm = serviceCategory.radius || (clientRadiusMeters ? clientRadiusMeters / 1000 : 5);
      const radiusRadians = radiusKm / EARTH_RADIUS_KM;

      const workers = await Worker.find({
        ...baseFilter,
        $or: [
          { 'categories.name': categoryMatcher(scName) },
          { category: categoryMatcher(scName) },
        ],
        location: {
          $geoWithin: {
            $centerSphere: [[userLng, userLat], radiusRadians],
          },
        },
      }).select(
        'fullName username profileImage categories category minCharge baseCharge perDayCharge skills locationText experience bio isOnline rating totalJobs memberSince location'
      ).lean();

      const workersWithDistance = workers.map((w) => {
        const [wLng, wLat] = w.location?.coordinates || [0, 0];
        const dLat   = ((wLat - userLat) * Math.PI) / 180;
        const dLng   = ((wLng - userLng) * Math.PI) / 180;
        const a      =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((wLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const distKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
        const entry = pickCategoryEntry(w, scName);
        return {
          id:           w._id,
          _id:          w._id,
          name:         w.fullName,
          initials:     w.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
          category:     entry?.name || scName,
          categories:   (w.categories || []).map((c) => c.name),
          skills:       w.skills,
          pricePerDay:  entry?.minCharge || 0,
          minCharge:    entry?.minCharge || 0,
          baseCharge:   entry?.baseCharge || 0,
          perDayCharge: entry?.perDayCharge || 0,
          rating:       w.rating,
          totalJobs:    w.totalJobs,
          distance:     `${kmToMinutes(distKm)} min away`,
          distanceKm:   distKm,
          available:    true,
          isOnline:     true,
          bio:          w.bio,
          experience:   w.experience,
          locationText: w.locationText,
          memberSince:  w.memberSince,
          profileImage: w.profileImage,
        };
      }).filter((w) => w.distanceKm <= radiusKm);

      workersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
      return res.json({ success: true, count: workersWithDistance.length, workers: workersWithDistance });
    }

    // ── Case B: Category is omitted ─────────────────────────────────────────
    // Replaces the N+1 query loop with a single max-radius Worker query,
    // then enforces category-specific radii in-memory without duplicate worker entries.
    const serviceCategories = await ServiceCategory.find({ active: true }).select('name radius').lean();
    if (!serviceCategories.length) {
      return res.json({ success: true, count: 0, workers: [] });
    }

    const maxRadiusKm = Math.max(
      ...serviceCategories.map((sc) => sc.radius || 0),
      clientRadiusMeters ? clientRadiusMeters / 1000 : 5
    );
    if (!maxRadiusKm || maxRadiusKm <= 0) {
      return res.json({ success: true, count: 0, workers: [] });
    }
    const maxRadiusRadians = maxRadiusKm / EARTH_RADIUS_KM;

    const categoryMap = new Map();
    const activeCategoryNames = [];
    for (const sc of serviceCategories) {
      if (sc.name) {
        const trimmed = sc.name.trim();
        categoryMap.set(trimmed.toLowerCase(), { name: trimmed, radius: sc.radius || 5 });
        activeCategoryNames.push(trimmed);
      }
    }

    const activeRegexes = activeCategoryNames.map((name) => new RegExp(`^${escapeRegex(name)}$`, 'i'));

    const workers = await Worker.find({
      ...baseFilter,
      $or: [
        { 'categories.name': { $in: activeRegexes } },
        { category: { $in: activeRegexes } },
      ],
      location: {
        $geoWithin: {
          $centerSphere: [[userLng, userLat], maxRadiusRadians],
        },
      },
    }).select(
      'fullName username profileImage categories category minCharge baseCharge perDayCharge skills locationText experience bio isOnline rating totalJobs memberSince location'
    ).lean();

    const workersWithDistance = [];
    for (const w of workers) {
      const [wLng, wLat] = w.location?.coordinates || [0, 0];
      const dLat   = ((wLat - userLat) * Math.PI) / 180;
      const dLng   = ((wLng - userLng) * Math.PI) / 180;
      const a      =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((wLat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const distKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));

      // Resolve primary matching category whose service radius encompasses this worker
      let matchedCategoryName = null;
      const workerCatList = w.categories || [];
      for (const c of workerCatList) {
        const catName = (c.name || '').trim();
        const scInfo = categoryMap.get(catName.toLowerCase());
        if (scInfo && distKm <= scInfo.radius) {
          matchedCategoryName = scInfo.name;
          break;
        }
      }
      if (!matchedCategoryName && w.category) {
        const catName = w.category.trim();
        const scInfo = categoryMap.get(catName.toLowerCase());
        if (scInfo && distKm <= scInfo.radius) {
          matchedCategoryName = scInfo.name;
        }
      }

      // If the worker is outside the service radius of ALL their categories, exclude them
      if (!matchedCategoryName) continue;

      const entry = pickCategoryEntry(w, matchedCategoryName);
      workersWithDistance.push({
        id:           w._id,
        _id:          w._id,
        name:         w.fullName,
        initials:     w.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
        category:     entry?.name || matchedCategoryName,
        categories:   (w.categories || []).map((c) => c.name),
        skills:       w.skills,
        pricePerDay:  entry?.minCharge || 0,
        minCharge:    entry?.minCharge || 0,
        baseCharge:   entry?.baseCharge || 0,
        perDayCharge: entry?.perDayCharge || 0,
        rating:       w.rating,
        totalJobs:    w.totalJobs,
        distance:     `${kmToMinutes(distKm)} min away`,
        distanceKm:   distKm,
        available:    true,
        isOnline:     true,
        bio:          w.bio,
        experience:   w.experience,
        locationText: w.locationText,
        memberSince:  w.memberSince,
        profileImage: w.profileImage,
      });
    }

    workersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return res.json({ success: true, count: workersWithDistance.length, workers: workersWithDistance });
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
        // Fetch all active service categories first
        const serviceCategories = await ServiceCategory.find({ active: true })
          .select('name image radius description workers')
          .sort({ name: 1 })
          .lean();

        // Use $geoWithin/$centerSphere per category so MongoDB's 2dsphere
        // index does the radius filtering — no full worker scan in JS.
        const EARTH_RADIUS_KM = 6371;
        const baseFilter = {
          isAvailable: { $ne: false },
          status:      { $not: { $eq: 'suspended' } },
          isVerified:  true,
        };

        const categoryCounts = await Promise.all(
          serviceCategories.map(async (sc) => {
            if (!sc.radius) return { sc, workers: [] };
            const radiusRadians = sc.radius / EARTH_RADIUS_KM;
            const workers = await Worker.find({
              ...baseFilter,
              $or: [
                { 'categories.name': categoryMatcher(sc.name) },
                { category: categoryMatcher(sc.name) },
              ],
              location: {
                $geoWithin: {
                  $centerSphere: [[parsedLng, parsedLat], radiusRadians],
                },
              },
            }).select('rating').lean();
            return { sc, workers };
          })
        );

        return categoryCounts.map(({ sc, workers }) => {
          const avgRating = workers.length
            ? workers.reduce((s, w) => s + w.rating, 0) / workers.length
            : 0;
          return {
            id:           sc._id,
            label:        sc.name,
            image:        sc.image,
            description:  sc.description || '',
            workersCount: sc.workers || workers.length,
            available:    workers.length,
            rating:       parseFloat(avgRating.toFixed(1)),
          };
        });
      });

      return res.json({ success: true, categories });
    }

    const serviceCategories = await ServiceCategory.find({ active: true })
      .select('name image description workers')
      .sort({ name: 1 })
      .lean();

    const categories = serviceCategories.map((sc) => ({
      id:           sc._id,
      label:        sc.name,
      image:        sc.image,
      description:  sc.description || '',
      workersCount: sc.workers || 0,
      available:    0,
      rating:       0,
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
      // $text uses the compound text index on fullName+categories.name+skills+bio
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
        .select('fullName username profileImage categories skills locationText isOnline rating totalJobs memberSince location')
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
        // Text search isn't scoped to one category the way nearby/getCategories
        // are — resolve the entry that matched the query text if possible,
        // otherwise fall back to the worker's first category, so pricing is
        // still real (never fabricated) even in this broader search context.
        const list  = w.categories || [];
        const ql    = q.toLowerCase();
        const entry = list.find((c) => (c.name || '').toLowerCase().includes(ql) || ql.includes((c.name || '').toLowerCase())) || list[0] || null;
        return {
          id:           w._id,
          _id:          w._id,
          name:         w.fullName,
          initials:     w.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
          category:     entry?.name || '',
          categories:   list.map((c) => c.name),
          skills:       w.skills,
          pricePerDay:  entry?.minCharge || 0,
          minCharge:    entry?.minCharge || 0,
          baseCharge:   entry?.baseCharge || 0,
          perDayCharge: entry?.perDayCharge || 0,
          rating:       w.rating,
          totalJobs:    w.totalJobs,
          distance:     distanceKm ? `${kmToMinutes(distanceKm)} min away` : '',
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