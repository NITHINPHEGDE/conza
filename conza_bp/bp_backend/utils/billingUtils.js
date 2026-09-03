const HOUR_MS   = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/**
 * Per-minute billing calculation (used when work exceeds 1 hour):
 * Converts elapsed time into exact billed hours with per-minute precision.
 * e.g.:
 *  - 60 mins  → 1.0 hr
 *  - 75 mins  → 1.25 hr
 *  - 90 mins  → 1.5 hr
 *  - 105 mins → 1.75 hr
 *
 * NOTE: Sub-1-hour work is handled separately in calculateHourlyCharge
 * and never reaches this function with elapsedMs <= HOUR_MS.
 */
const calculateBilledHours = (elapsedMs) => {
  if (!elapsedMs || elapsedMs <= 0) return 1;
  const elapsedMinutes = Math.ceil(elapsedMs / MINUTE_MS);
  if (elapsedMinutes <= 60) return 1;
  return Number((elapsedMinutes / 60).toFixed(4));
};

/**
 * Calculate the charge for a completed immediate labour booking.
 *
 * Billing rules:
 *  - If work duration is ≤ 1 hour  → charge the combined baseCharge (minimum
 *    call-out fee / fixed 1st-hour fee).
 *  - If work duration is > 1 hour  → fixed baseCharge for the first hour +
 *    per-minute calculation based on hourlyRate for all time worked beyond 1 hour.
 *
 * @param {Date|string} workStartTime  - When status moved to 'in_progress'.
 * @param {Date|string} workEndTime    - When status moved to completion.
 * @param {number}      hourlyRate     - Combined per-hour rate of all workers.
 * @param {number}      baseCharge     - Combined base/call-out fee of all workers (fixed 1st-hr charge).
 * @returns {{ billedHours: number, subtotal: number, baseFeeApplied: boolean }}
 */
const calculateHourlyCharge = (workStartTime, workEndTime, hourlyRate, baseCharge = 0) => {
  const elapsedMs = new Date(workEndTime).getTime() - new Date(workStartTime).getTime();
  const fixedBase = Math.round(Number(baseCharge) || 0);

  // ── Sub-1-hour: charge the fixed base fee ──────────────────────────────────
  if (elapsedMs <= HOUR_MS) {
    return { billedHours: 0, subtotal: fixedBase, baseFeeApplied: true };
  }

  // ── Over 1 hour: fixed baseCharge for 1st hr + per-minute rate for extra time ─
  const billedHours = calculateBilledHours(elapsedMs);
  const extraHours  = Math.max(0, billedHours - 1);
  const extraCharge = Math.round(extraHours * (Number(hourlyRate) || 0));
  const subtotal    = fixedBase + extraCharge;

  return { billedHours, subtotal, baseFeeApplied: false };
};

module.exports = { calculateBilledHours, calculateHourlyCharge };
