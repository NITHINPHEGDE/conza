const PricingConfigAdmin = require('../models/PricingConfigAdmin');
const { withCache } = require('./cacheHelpers');
const logger = require('./logger');

// Fallback values used if the admin panel has never saved labour pricing
// yet, or if the admin database is temporarily unreachable — keeps the
// customer app fully functional either way.
const DEFAULT_LABOUR_CONFIG = {
  platformCommission: 12,
  costRate: 18,
  serviceCharge: 25,
  minBookingFee: 50,
  cancellationFee: 30,
  peakHourMultiplier: 1.5,
};

const CACHE_KEY = 'pricing:config:labour';
// Primary path: the admin backend actively busts this key on save (see
// conza_admin/admin_backend/config/customersRedis.js → bustPricingConfigCache),
// so changes reflect on the very next request. This short TTL is only a
// safety net for deployments where that bust can't reach this Redis.
const CACHE_TTL = 15; // seconds

// ── Fetch the admin-configured Labour pricing (Finance → Pricing → Labour)
// Cached version — used on every booking creation (hot path).
const getLabourPricingConfig = async () => {
  try {
    return await withCache(CACHE_KEY, CACHE_TTL, async () => {
      const doc = await PricingConfigAdmin.findOne({ category: 'labour' }).lean();
      if (!doc || !doc.settings) return DEFAULT_LABOUR_CONFIG;
      return { ...DEFAULT_LABOUR_CONFIG, ...doc.settings };
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to fetch labour pricing config, using defaults');
    return DEFAULT_LABOUR_CONFIG;
  }
};

// Fresh (no-cache) version — used by bill-preview so the config the user
// sees always reflects the latest admin save, without waiting for TTL or a
// cache bust to propagate.
const getLabourPricingConfigFresh = async () => {
  try {
    const doc = await PricingConfigAdmin.findOne({ category: 'labour' }).lean();
    if (!doc || !doc.settings) return DEFAULT_LABOUR_CONFIG;
    const fresh = { ...DEFAULT_LABOUR_CONFIG, ...doc.settings };
    return fresh;
  } catch (err) {
    logger.warn({ err }, 'Failed to fetch fresh labour pricing config, using defaults');
    return DEFAULT_LABOUR_CONFIG;
  }
};

// ── Core billing calculation ────────────────────────────────────────────
// Order: (hourlyRate × surge) → minBookingFee floor → + service + gst +
//        platform, all computed once → final bill.
// GST (costRate) and Platform Commission are both calculated as a
// percentage of the SAME surged/floored base — never stacked on top of
// each other — then added alongside the flat Service Charge.
// rawBase: raw worker cost before any admin-configured adjustments
//          (e.g. pricePerDay, or perDayCharge * totalDays, or
//          avgRate * requiredWorkers for autobook).
const computeLabourBill = (rawBase, config) => {
  const platformCommission = Number(config.platformCommission) || 0;
  const costRate = Number(config.costRate) || 0; // GST %
  const serviceCharge = Number(config.serviceCharge) || 0;
  const minBookingFee = Number(config.minBookingFee) || 0;
  const cancellationFee = Number(config.cancellationFee) || 0;
  const peakHourMultiplier = Number(config.peakHourMultiplier) || 1;

  const baseCost = Math.round(Number(rawBase) || 0);

  // 1. Surge (Peak Hour Multiplier) — ALWAYS applied to the hourly rate.
  const afterSurge = Math.round(baseCost * peakHourMultiplier);

  // 2. Min Booking Fee — floor applied to the surged base, BEFORE gst /
  //    platform / service are calculated, so it never compounds with them.
  let subtotal = afterSurge;
  let minBookingFeeApplied = false;
  if (minBookingFee > 0 && subtotal < minBookingFee) {
    subtotal = minBookingFee;
    minBookingFeeApplied = true;
  }

  // 3. GST — percentage of the surged base.
  const costRateAmount = Math.round(subtotal * (costRate / 100));

  // 4. Platform Commission — percentage of the surged base (NOT of the
  //    GST-inclusive amount — this was the tax-on-tax compounding bug).
  const platformCommissionAmount = Math.round(subtotal * (platformCommission / 100));

  // 5. Final bill = (hourlyRate × surge) + service + gst + platform.
  const total = subtotal + serviceCharge + costRateAmount + platformCommissionAmount;

  return {
    baseCost,
    costRate,
    costRateAmount,
    peakHourApplied: true,
    peakHourMultiplier,
    subtotal,
    minBookingFee,
    minBookingFeeApplied,
    serviceCharge,
    platformCommission,
    platformCommissionAmount,
    cancellationFee,
    total,
  };
};

module.exports = { getLabourPricingConfig, getLabourPricingConfigFresh, computeLabourBill, DEFAULT_LABOUR_CONFIG };

