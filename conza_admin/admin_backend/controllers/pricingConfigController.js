const PricingConfig = require('../models/PricingConfig')
const { sendSuccess } = require('../utils/response')
const { createError } = require('../utils/error')
const { bustPricingConfigCache } = require('../config/customersRedis')

// Defaults mirror the admin frontend's PricingManagement.jsx so a category
// that has never been saved still returns sensible values.
const DEFAULT_SETTINGS = {
  labour: {
    platformCommission: 12,
    costRate: 18,
    serviceCharge: 25,
    minBookingFee: 50,
    cancellationFee: 30,
    peakHourMultiplier: 1.5,
  },
  materials: {
    platformCommission: 8,
    gstRate: 18,
    deliveryCharge: 40,
    minOrderValue: 200,
    bulkDiscount: 5,
    vendorCommission: 92,
  },
  rentals: {
    platformCommission: 10,
    gstRate: 18,
    securityDepositPercent: 15,
    damageWaiver: 50,
    lateReturnFee: 100,
    cleaningFee: 30,
  },
}

const VALID_CATEGORIES = ['labour', 'materials', 'rentals']

exports.getPricingConfig = async (req, res, next) => {
  try {
    const { category } = req.query

    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return next(createError(400, 'Invalid pricing category.'))
      }
      const doc = await PricingConfig.findOne({ category })
      const settings = doc ? doc.settings : DEFAULT_SETTINGS[category]
      return sendSuccess(res, 200, 'Pricing config fetched', {
        category,
        settings,
        updatedAt: doc ? doc.updatedAt : null,
      })
    }

    const docs = await PricingConfig.find({})
    const byCategory = {}
    VALID_CATEGORIES.forEach((cat) => {
      const found = docs.find((d) => d.category === cat)
      byCategory[cat] = found ? found.settings : DEFAULT_SETTINGS[cat]
    })
    sendSuccess(res, 200, 'Pricing config fetched', { pricing: byCategory })
  } catch (err) {
    next(err)
  }
}

exports.upsertPricingConfig = async (req, res, next) => {
  try {
    const { category } = req.params
    const { settings } = req.body

    if (!VALID_CATEGORIES.includes(category)) {
      return next(createError(400, 'Invalid pricing category.'))
    }
    if (!settings || typeof settings !== 'object') {
      return next(createError(400, 'settings object is required.'))
    }

    const doc = await PricingConfig.findOneAndUpdate(
      { category },
      {
        category,
        settings,
        updatedByAdmin: req.admin?.name || '',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    // Instantly invalidate the customer app's cached copy of this pricing
    // config (Redis, shared with conza_customers/conza_backend) so the
    // checkout screen's live billing reflects this save on its very next
    // request instead of waiting out the cache TTL. Best-effort — if Redis
    // is unreachable the customer backend's short TTL still self-heals.
    await bustPricingConfigCache(category)

    req.auditTarget = `Pricing Config - ${category}`
    req.auditDetails = `Updated ${category} pricing settings`

    sendSuccess(res, 200, 'Pricing config saved', {
      category: doc.category,
      settings: doc.settings,
      updatedAt: doc.updatedAt,
    })
  } catch (err) {
    next(err)
  }
}
