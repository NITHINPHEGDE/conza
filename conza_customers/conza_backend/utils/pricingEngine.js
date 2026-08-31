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
const CACHE_TTL = 60; // seconds — admin changes reflect within a minute

// ── Fetch the admin-configured Labour pricing (Finance → Pricing → Labour)
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

// ── Peak-hour check ─────────────────────────────────────────────────────
// Common peak windows for home-service demand: 7–10 AM and 6–9 PM.
const isCurrentlyPeakHour = (date = new Date()) => {
  const hour = date.getHours();
  return (hour >= 7 && hour < 10) || (hour >= 18 && hour < 21);
};

// ── Core billing calculation ────────────────────────────────────────────
// rawBase: raw worker cost before any admin-configured adjustments
//          (e.g. pricePerDay, or perDayCharge * totalDays, or
//          avgRate * requiredWorkers for autobook).
const computeLabourBill = (rawBase, config, { peakHour } = {}) => {
  const platformCommission = Number(config.platformCommission) || 0;
  const costRate = Number(config.costRate) || 0;
  const serviceCharge = Number(config.serviceCharge) || 0;
  const minBookingFee = Number(config.minBookingFee) || 0;
  const cancellationFee = Number(config.cancellationFee) || 0;
  const peakHourMultiplier = Number(config.peakHourMultiplier) || 1;

  const baseCost = Math.round(Number(rawBase) || 0);

  // Cost Rate — markup applied on top of the worker's base rate.
  const costRateAmount = Math.round(baseCost * (costRate / 100));
  let adjustedBase = baseCost + costRateAmount;

  // Peak Hour Multiplier — applied only during configured peak windows.
  const isPeak = peakHour !== undefined ? peakHour : isCurrentlyPeakHour();
  let peakHourApplied = false;
  if (isPeak && peakHourMultiplier > 1) {
    adjustedBase = Math.round(adjustedBase * peakHourMultiplier);
    peakHourApplied = true;
  }

  // Min Booking Fee — floor applied to the adjusted subtotal.
  let subtotal = adjustedBase;
  let minBookingFeeApplied = false;
  if (minBookingFee > 0 && subtotal < minBookingFee) {
    subtotal = minBookingFee;
    minBookingFeeApplied = true;
  }

  // Service Charge — flat fee added once.
  // Platform Commission — percentage of the subtotal.
  const platformCommissionAmount = Math.round(subtotal * (platformCommission / 100));
  const total = subtotal + serviceCharge + platformCommissionAmount;

  return {
    baseCost,
    costRate,
    costRateAmount,
    isPeakHour: isPeak,
    peakHourApplied,
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

module.exports = { getLabourPricingConfig, isCurrentlyPeakHour, computeLabourBill, DEFAULT_LABOUR_CONFIG };
