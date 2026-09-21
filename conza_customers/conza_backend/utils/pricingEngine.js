const PricingConfigAdmin = require('../models/PricingConfigAdmin');
const { withCache } = require('./cacheHelpers');
const logger = require('./logger');

// Fallback values used if the admin panel has never saved labour pricing
// yet, or if the admin database is temporarily unreachable — keeps the
// customer app fully functional either way.
// NOTE: there is no global minBookingFee here anymore — the minimum
// charge is per-category (ServiceCategory.baseCharge, set in the admin
// panel's Categories screen) and is passed into computeLabourBill()
// directly by the caller.
const DEFAULT_LABOUR_CONFIG = {
  platformCommission: 12,
  costRate: 18,
  serviceCharge: 25,
  cancellationFee: 30,
  peakHourMultiplier: 1.5,
};

// ── Per-entity checkboxes (Admin → Finance → Pricing → Labour) ─────────────
// The admin ticks/unticks each pricing entity. `config.enabledFields[key]`
// === false means the entity is unticked: it is treated as absent (0 / ×1),
// so it is never shown to the customer and never added to any bill. A config
// saved before the checkboxes existed has no `enabledFields`, so everything
// stays applied exactly as before.
const LABOUR_ENTITY_KEYS = [
  'platformCommission',
  'costRate',
  'serviceCharge',
  'cancellationFee',
  'peakHourMultiplier',
];

const isEntityEnabled = (config, key) => {
  const flags = config && config.enabledFields;
  if (!flags || typeof flags !== 'object') return true;
  return flags[key] !== false && flags[key] !== 'false';
};

// The values that actually apply to a bill: unticked entities collapse to
// 0 (charges) or 1 (peak-hour multiplier).
const resolveLabourConfig = (config) => {
  const cfg = config || {};
  const peakHourEnabled = isEntityEnabled(cfg, 'peakHourMultiplier');
  return {
    platformCommission: isEntityEnabled(cfg, 'platformCommission') ? (Number(cfg.platformCommission) || 0) : 0,
    costRate: isEntityEnabled(cfg, 'costRate') ? (Number(cfg.costRate) || 0) : 0,
    serviceCharge: isEntityEnabled(cfg, 'serviceCharge') ? (Number(cfg.serviceCharge) || 0) : 0,
    cancellationFee: isEntityEnabled(cfg, 'cancellationFee') ? (Number(cfg.cancellationFee) || 0) : 0,
    peakHourMultiplier: peakHourEnabled ? (Number(cfg.peakHourMultiplier) || 1) : 1,
    peakHourEnabled,
  };
};

// True when a stored bill breakdown no longer agrees with which entities are
// currently ticked (an unticked entity still charged, or a ticked one that is
// missing) — used to re-price an unpaid completed booking before payment.
const billNeedsRepricing = (billing, config) => {
  const b = billing || {};
  const eff = resolveLabourConfig(config);
  const has = (n) => Number(n) > 0;
  if (has(eff.serviceCharge) !== has(b.serviceCharge)) return true;
  if (has(eff.costRate) !== has(b.costRate)) return true;
  if (has(eff.platformCommission) !== has(b.platformCommission)) return true;
  if ((eff.peakHourMultiplier !== 1) !== ((Number(b.peakHourMultiplier) || 1) !== 1)) return true;
  return false;
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
// Order: (hourlyRate × surge) → minimum-charge floor → + service + gst +
//        platform, all computed once → final bill.
// GST (costRate) and Platform Commission are both calculated as a
// percentage of the SAME surged/floored base — never stacked on top of
// each other — then added alongside the flat Service Charge.
// rawBase: raw worker cost before any admin-configured adjustments
//          (e.g. pricePerDay, or perDayCharge * totalDays, or
//          avgRate * requiredWorkers for autobook).
// categoryMinCharge: the MINIMUM charge floor for this specific labour
//          category — ServiceCategory.baseCharge, set per-category in the
//          admin panel's Categories screen (NOT a global admin setting;
//          every category has its own value, e.g. Painter ₹99, Carpenter
//          ₹0). Callers must fetch this from ServiceCategory and pass it
//          in explicitly.
const computeLabourBill = (rawBase, config, categoryMinCharge) => {
  // Unticked entities (Finance → Pricing checkboxes) resolve to 0 / ×1.
  const eff = resolveLabourConfig(config);
  const platformCommission = eff.platformCommission;
  const costRate = eff.costRate; // GST %
  const serviceCharge = eff.serviceCharge;
  const minBookingFee = Number(categoryMinCharge) || 0;
  const cancellationFee = eff.cancellationFee;
  const peakHourMultiplier = eff.peakHourMultiplier;

  const baseCost = Math.round(Number(rawBase) || 0);

  // 1. Surge (Peak Hour Multiplier) — ALWAYS applied to the hourly rate.
  const afterSurge = Math.round(baseCost * peakHourMultiplier);

  // 2. Minimum charge (per-category) — floor applied to the surged base,
  //    BEFORE gst / platform / service are calculated, so it never
  //    compounds with them.
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
    peakHourApplied: eff.peakHourEnabled,
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

// ── Checkout price-estimate scenarios ───────────────────────────────────
// Used by POST /api/bookings/labour/bill-preview to show the customer TWO
// estimates side by side for an immediate (hourly) labour booking:
//   • lessThanHour — foundation is the worker's fixed BASE charge
//   • oneHour      — foundation is the worker's PER-HOUR rate
// and ONE estimate (scheduled) for a multi-day booking, where the
// foundation is the per-day rate × number of days.
// Every scenario runs through the exact same computeLabourBill() pipeline
// (surge → minimum charge → GST → platform commission → service charge)
// using the admin's live Finance → Pricing → Labour settings. Each worker is
// billed as their own booking (one Booking document per worker), so the
// bill is computed per worker and the results are summed.
const positiveNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Foundation rates come from the worker's CATEGORY (Admin → Finance →
// Categories: Base / Hour / Day) — the category is the source of truth.
// The worker's own snapshot is only a fallback when the category rate is
// missing/0 or the category can't be found.
const normaliseWorkerRates = (w, categoryRates) => {
  const workerHourly = positiveNumber(w && w.pricePerDay) || positiveNumber(w && w.minCharge);
  const cat = categoryRates || {};
  const hourlyRate = positiveNumber(cat.perHourCharge) || workerHourly;
  return {
    hourlyRate,
    baseCharge: positiveNumber(cat.baseCharge) || positiveNumber(w && w.baseCharge),
    perDayCharge:
      positiveNumber(cat.perDayCharge) || positiveNumber(w && w.perDayCharge) || hourlyRate,
  };
};

const buildScenario = (rawBases, config, categoryBaseCharge) => {
  const totals = {
    baseCost: 0,
    surgeAmount: 0,
    minChargeAdjustment: 0,
    subtotal: 0,
    serviceCharge: 0,
    costRateAmount: 0,
    platformCommissionAmount: 0,
    total: 0,
  };
  let minBookingFeeApplied = false;

  rawBases.forEach((rawBase) => {
    const bill = computeLabourBill(rawBase, config, categoryBaseCharge);
    const afterSurge = Math.round(bill.baseCost * bill.peakHourMultiplier);
    totals.baseCost += bill.baseCost;
    totals.surgeAmount += afterSurge - bill.baseCost;
    totals.minChargeAdjustment += bill.subtotal - afterSurge;
    totals.subtotal += bill.subtotal;
    totals.serviceCharge += bill.serviceCharge;
    totals.costRateAmount += bill.costRateAmount;
    totals.platformCommissionAmount += bill.platformCommissionAmount;
    totals.total += bill.total;
    if (bill.minBookingFeeApplied) minBookingFeeApplied = true;
  });

  const eff = resolveLabourConfig(config);
  return {
    ...totals,
    costRate: eff.costRate,
    platformCommission: eff.platformCommission,
    peakHourMultiplier: eff.peakHourMultiplier,
    minBookingFeeApplied,
  };
};

const computeLabourScenarioEstimates = ({
  workers = [],
  config,
  categoryRates = null, // { baseCharge, perHourCharge, perDayCharge } from ServiceCategory
  isImmediate = true,
  totalDays = 1,
  isAutobook = false,
  requiredWorkers = 0,
}) => {
  // The per-category minimum-charge floor is the category's Base charge.
  const categoryBaseCharge = categoryRates ? positiveNumber(categoryRates.baseCharge) : 0;

  const rates = (Array.isArray(workers) ? workers : []).map((w) =>
    normaliseWorkerRates(w, categoryRates)
  );

  let units = rates;
  if (isAutobook) {
    // Quick Auto Book: any nearby worker may accept, so estimate with the
    // category rates × the number of workers requested.
    const need = Math.max(parseInt(requiredWorkers, 10) || 0, 1);
    const avg = (key) =>
      rates.length ? rates.reduce((s, r) => s + r[key], 0) / rates.length : 0;
    const avgUnit = rates.length
      ? {
          hourlyRate: avg('hourlyRate'),
          baseCharge: avg('baseCharge'),
          perDayCharge: avg('perDayCharge'),
        }
      : normaliseWorkerRates({}, categoryRates);
    units = Array.from({ length: need }, () => avgUnit);
  }

  const days = Math.max(parseInt(totalDays, 10) || 1, 1);

  if (!isImmediate) {
    return {
      mode: 'scheduled',
      workerCount: units.length,
      totalDays: days,
      scheduled: buildScenario(
        units.map((u) => u.perDayCharge * days),
        config,
        categoryBaseCharge
      ),
    };
  }

  return {
    mode: 'immediate',
    workerCount: units.length,
    lessThanHour: buildScenario(units.map((u) => u.baseCharge), config, categoryBaseCharge),
    oneHour: buildScenario(units.map((u) => u.hourlyRate), config, categoryBaseCharge),
  };
};

module.exports = {
  getLabourPricingConfig,
  getLabourPricingConfigFresh,
  computeLabourBill,
  computeLabourScenarioEstimates,
  DEFAULT_LABOUR_CONFIG,
  LABOUR_ENTITY_KEYS,
  isEntityEnabled,
  resolveLabourConfig,
  billNeedsRepricing,
};

