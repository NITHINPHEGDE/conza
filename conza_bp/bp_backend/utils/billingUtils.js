const HOUR_MS = 60 * 60 * 1000;

/**
 * Tiered half-hour billing (used when work exceeds 1 hour):
 *  - 1hr to 1hr30  → 1.5 hr charge
 *  - 1hr30 to 2hr  → 2 hr charge
 *  - 2hr to 2hr30  → 2.5 hr charge
 *  ...and so on.
 *
 * NOTE: Sub-1-hour work is handled separately in calculateHourlyCharge
 * and never reaches this function with elapsedMs <= HOUR_MS.
 */
const calculateBilledHours = (elapsedMs) => {
  const elapsedHours = elapsedMs / HOUR_MS;
  if (elapsedHours <= 0) return 1;
  const roundedToHalfHour = Math.ceil(elapsedHours * 2) / 2;
  return Math.max(1, roundedToHalfHour);
};

/**
 * Calculate the charge for a completed immediate labour booking.
 *
 * Billing rules:
 *  - If work duration is ≤ 1 hour  → charge the combined baseCharge (minimum
 *    call-out fee), regardless of the per-hour rate.
 *  - If work duration is > 1 hour  → standard tiered hourly billing applies
 *    (rounded up to the nearest 30 min), using hourlyRate.
 *
 * @param {Date|string} workStartTime  - When status moved to 'in_progress'.
 * @param {Date|string} workEndTime    - When status moved to completion.
 * @param {number}      hourlyRate     - Combined per-hour rate of all workers.
 * @param {number}      baseCharge     - Combined base/call-out fee of all workers.
 *                                       Applied when work is ≤ 1 hour.
 * @returns {{ billedHours: number, subtotal: number, baseFeeApplied: boolean }}
 */
const calculateHourlyCharge = (workStartTime, workEndTime, hourlyRate, baseCharge = 0) => {
  const elapsedMs = new Date(workEndTime).getTime() - new Date(workStartTime).getTime();

  // ── Sub-1-hour: charge the base fee ───────────────────────────────────────
  if (elapsedMs <= HOUR_MS) {
    const subtotal = Math.round(Number(baseCharge) || 0);
    return { billedHours: 0, subtotal, baseFeeApplied: true };
  }

  // ── Over 1 hour: standard tiered hourly billing ───────────────────────────
  const billedHours = calculateBilledHours(elapsedMs);
  const subtotal    = Math.round(billedHours * (Number(hourlyRate) || 0));
  return { billedHours, subtotal, baseFeeApplied: false };
};

module.exports = { calculateBilledHours, calculateHourlyCharge };
