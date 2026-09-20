// ── Worker "Estimated Earning" for a labour work request ────────────────
// Shown to the worker on the Request Details screen BEFORE they accept.
//
// Everything is driven by the admin panel → Finance → Categories values of
// the request's category (stored on ServiceCategory):
//   • baseCharge     → what the worker earns (before commission) if the job
//                      finishes within 1 hour (covers the first hour)
//   • perHourCharge  → each extra hour after the first hour
//   • perDayCharge   → scheduled (multi-day) bookings, × number of days
//   • commission (%) → Conza's commission taken from the worker's earning
// worker earning = charge − round(charge × commission / 100)
//
// This mirrors the real billing rule (billingUtils.calculateHourlyCharge):
// the base charge covers the first hour, extra time is charged at the
// hourly rate. The customer-side charges (GST, service charge, platform
// commission on the customer's bill) are NOT part of the worker's earning.
const DEFAULT_COMMISSION_PERCENT = 15; // same default as ServiceCategory.commission

const positive = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const resolveCommission = (category) => {
  if (category && typeof category.commission === 'number' && Number.isFinite(category.commission)) {
    return Math.min(Math.max(category.commission, 0), 100);
  }
  return DEFAULT_COMMISSION_PERCENT;
};

// Category rates are the source of truth. The worker's own category
// snapshot (Worker.categories[]) is only a fallback when the category
// document can't be found or the rate is 0/unset.
const resolveRates = (category, workerCategoryEntry) => {
  const cat = category || {};
  const own = workerCategoryEntry || {};
  return {
    baseCharge:    positive(cat.baseCharge)    || positive(own.baseCharge),
    perHourCharge: positive(cat.perHourCharge) || positive(own.minCharge),
    perDayCharge:  positive(cat.perDayCharge)  || positive(own.perDayCharge),
    commission:    resolveCommission(category),
  };
};

const applyCommission = (grossInput, percent) => {
  const gross = Math.round(positive(grossInput));
  const commissionAmount = Math.round(gross * (percent / 100));
  return { gross, commissionAmount, net: Math.max(gross - commissionAmount, 0) };
};

const computeWorkerEarningEstimate = ({
  category = null,
  workerCategoryEntry = null,
  isImmediate = true,
  totalDays = 1,
} = {}) => {
  const rates = resolveRates(category, workerCategoryEntry);
  const percent = rates.commission;

  // ── Scheduled (multi-day): fixed per-day rate × days ─────────────────
  if (!isImmediate) {
    const days = Math.min(Math.max(parseInt(totalDays, 10) || 1, 1), 365);
    const perDay = applyCommission(rates.perDayCharge, percent);
    const total  = applyCommission(rates.perDayCharge * days, percent);
    return {
      mode: 'scheduled',
      commissionPercent: percent,
      totalDays: days,
      perDayCharge: rates.perDayCharge,
      perDay,
      total,
      minimumEarning: total.net,
    };
  }

  // ── Immediate (hourly): base covers hour 1, then per-hour ────────────
  const oneHour    = applyCommission(rates.baseCharge, percent);
  const twoHours   = applyCommission(rates.baseCharge + rates.perHourCharge, percent);
  const threeHours = applyCommission(rates.baseCharge + 2 * rates.perHourCharge, percent);

  return {
    mode: 'immediate',
    commissionPercent: percent,
    baseCharge: rates.baseCharge,
    perHourCharge: rates.perHourCharge,
    withinOneHour: oneHour,
    // Each extra hour = difference between the 2-hour and 1-hour earning,
    // so the numbers on screen always add up exactly.
    extraHour: {
      gross: twoHours.gross - oneHour.gross,
      commissionAmount: twoHours.commissionAmount - oneHour.commissionAmount,
      net: twoHours.net - oneHour.net,
    },
    examples: [
      { hours: 2, net: twoHours.net },
      { hours: 3, net: threeHours.net },
    ],
    minimumEarning: oneHour.net,
  };
};

module.exports = { computeWorkerEarningEstimate, DEFAULT_COMMISSION_PERCENT };
