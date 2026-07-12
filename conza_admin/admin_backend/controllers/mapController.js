const Worker = require('../models/Worker')
const Vendor = require('../models/Vendor')
const { sendSuccess } = require('../utils/response')

// Vendors (sellers) have no GPS coordinates anywhere in this system — only
// city/address/pincode text (see conza_vendor/sellerb/models/Seller.js).
// We approximate each vendor's pin using known city centers, with a small
// deterministic per-vendor offset so vendors sharing a city don't all
// render as a single overlapping pin.
const CITY_COORDS = {
  bangalore: [12.9716, 77.5946], bengaluru: [12.9716, 77.5946],
  mumbai: [19.0760, 72.8777], delhi: [28.7041, 77.1025],
  hyderabad: [17.3850, 78.4867], chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639], pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714], jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462], kochi: [9.9312, 76.2673],
  coimbatore: [11.0168, 76.9558], surat: [21.1702, 72.8311],
  chandigarh: [30.7333, 76.7794],
}
const DEFAULT_CITY_COORDS = CITY_COORDS.bangalore

const jitterFromId = (id) => {
  const str = id.toString()
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  const angle = (hash % 360) * (Math.PI / 180)
  const distanceDeg = ((hash % 100) / 100) * 0.02 // ~0–2km spread at Indian latitudes
  return [Math.cos(angle) * distanceDeg, Math.sin(angle) * distanceDeg]
}

exports.getLiveTracking = async (req, res, next) => {
  try {
    // Real GPS coordinates live at location.coordinates: [lng, lat] (GeoJSON),
    // written by the worker app's location-tracking flush job. [0,0] is the
    // schema default for a worker who has never sent a location ping.
    const workersRaw = await Worker.find({
      isOnline: true,
      'location.coordinates.0': { $ne: 0 },
      'location.coordinates.1': { $ne: 0 },
    }).select('fullName category location isAvailable status rating')

    const workers = workersRaw
      .map(w => ({
        id: w._id,
        fullName: w.fullName,
        category: w.category,
        latitude: w.location?.coordinates?.[1] ?? null,
        longitude: w.location?.coordinates?.[0] ?? null,
        isAvailable: w.isAvailable,
        status: w.status,
        rating: w.rating,
      }))
      .filter(w => w.latitude != null && w.longitude != null)

    const vendorsRaw = await Vendor.find({ status: 'active' })
      .select('name shopName city status rating')

    const vendors = vendorsRaw.map(v => {
      const cityKey = (v.city || '').trim().toLowerCase()
      const [baseLat, baseLng] = CITY_COORDS[cityKey] || DEFAULT_CITY_COORDS
      const [dLat, dLng] = jitterFromId(v._id)
      return {
        id: v._id,
        name: v.name,
        shopName: v.shopName,
        city: v.city,
        status: v.status,
        rating: v.rating,
        latitude: baseLat + dLat,
        longitude: baseLng + dLng,
        approximate: !CITY_COORDS[cityKey], // true when city wasn't recognized, plotted at default
      }
    })

    sendSuccess(res, 200, 'Live tracking data fetched', { workers, vendors })
  } catch (err) {
    next(err)
  }
}
