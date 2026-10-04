/**
 * services/orderPricingService.js — Authoritative Server-Side Pricing Engine
 *
 * Enforces zero-trust financial calculations for Material and Rental orders:
 * - Product prices, rental rates, and deposits are ALWAYS loaded from MongoDB
 * - Client-supplied subtotals, delivery charges, and totals are completely discarded
 * - Strict quantity and parameter validation (positive integers only)
 * - Deterministic, configurable delivery charge derivation
 */

'use strict';

const mongoose = require('mongoose');
const Product = require('../models/Product');
const PricingConfigAdmin = require('../models/PricingConfigAdmin');
const { withCache } = require('../utils/cacheHelpers');
const logger = require('../utils/logger');

// ── Default Configs (mirrors admin PricingManagement defaults) ───────────────
const DEFAULT_MATERIALS_CONFIG = {
  platformCommission: 8,
  gstRate: 18,
  deliveryCharge: 40,
  minOrderValue: 200,
  bulkDiscount: 5,
};

const DEFAULT_RENTALS_CONFIG = {
  platformCommission: 10,
  gstRate: 18,
  securityDepositPercent: 15,
  damageWaiver: 50,
  lateReturnFee: 100,
  cleaningFee: 30,
};

// ── Deterministic Vendor Delivery Charge Hash ────────────────────────────────
const hashString = (value) => {
  const str = String(value || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const RANGES = {
  material: { base: 150, span: 200 },
  rental:   { base: 600, span: 600 },
};

const calculateVendorDeliveryCharge = (sellerId, type = 'material') => {
  const { base, span } = RANGES[type] || RANGES.material;
  const hash = hashString(sellerId);
  const raw = base + (hash % span);
  return Math.round(raw / 10) * 10;
};

// ── Fetch Admin Pricing Settings with Short-Lived Cache ──────────────────────
const getAdminPricingConfig = async (category) => {
  try {
    return await withCache(`pricing:config:${category}`, 30, async () => {
      const doc = await PricingConfigAdmin.findOne({ category }).lean();
      const defaults = category === 'materials' ? DEFAULT_MATERIALS_CONFIG : DEFAULT_RENTALS_CONFIG;
      if (!doc || !doc.settings) return defaults;
      return { ...defaults, ...doc.settings };
    });
  } catch (err) {
    logger.warn({ err, category }, 'Failed to fetch admin pricing config, using defaults');
    return category === 'materials' ? DEFAULT_MATERIALS_CONFIG : DEFAULT_RENTALS_CONFIG;
  }
};

// ── Validate Positive Integer ────────────────────────────────────────────────
const validatePositiveInteger = (value, fieldName, max = 100000) => {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0 || num > max) {
    throw new Error(`Invalid ${fieldName}: must be an integer between 1 and ${max}`);
  }
  return num;
};

/**
 * Calculates authoritative pricing for a Material order.
 *
 * @param {Array<{ productId: string, qty: number }>} rawItems
 * @param {string} sellerId
 * @param {object} [session] - Optional MongoDB session
 * @returns {Promise<{ snapshotItems: Array, subtotal: number, deliveryCharge: number, total: number, productMap: object }>}
 */
const calculateMaterialOrderPricing = async (rawItems, sellerId, session = null) => {
  if (!Array.isArray(rawItems) || !rawItems.length) {
    throw new Error('Order items must be a non-empty array');
  }

  const sanitizedItems = rawItems.map((item, index) => {
    if (!item || !item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
      throw new Error(`Invalid productId at item index ${index}`);
    }
    const qty = validatePositiveInteger(item.qty, `quantity for product ${item.productId}`, 10000);
    return { productId: item.productId.toString(), qty };
  });

  const productIds = sanitizedItems.map((i) => i.productId);
  const query = Product.find({
    _id: { $in: productIds },
    seller: sellerId,
  });
  if (session) query.session(session);

  const products = await query.lean();
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  const snapshotItems = [];

  for (const item of sanitizedItems) {
    const product = productMap[item.productId];
    if (!product) {
      throw new Error(`Product not found or does not belong to seller: ${item.productId}`);
    }
    if (product.type !== 'material') {
      throw new Error(`Product ${product.title} is not a material item`);
    }
    if (product.isAvailable === false) {
      throw new Error(`Product ${product.title} is currently unavailable`);
    }

    const unitPrice = Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Invalid authoritative price for product ${product.title}`);
    }

    const minOrder = Number(product.minOrder) || 1;
    if (item.qty < minOrder) {
      throw new Error(`Minimum order quantity for ${product.title} is ${minOrder}`);
    }

    const itemSubtotal = Math.round(unitPrice * item.qty);
    subtotal += itemSubtotal;

    snapshotItems.push({
      product: product._id,
      title: product.title,
      image: product.images?.[0] || null,
      price: unitPrice,
      unit: product.unit || 'piece',
      qty: item.qty,
      days: null,
      subtotal: itemSubtotal,
    });
  }

  const deliveryCharge = calculateVendorDeliveryCharge(sellerId, 'material');
  const total = subtotal + deliveryCharge;

  return {
    snapshotItems,
    subtotal,
    deliveryCharge,
    total,
    depositAmount: 0,
    productMap,
  };
};

/**
 * Calculates authoritative pricing for a Rental order.
 *
 * @param {Array<{ productId: string, qty: number, days?: number, rentalDays?: number }>} rawItems
 * @param {string} sellerId
 * @param {number|null} [orderDurationDays]
 * @param {object} [session] - Optional MongoDB session
 * @returns {Promise<{ snapshotItems: Array, subtotal: number, deliveryCharge: number, depositAmount: number, total: number, productMap: object }>}
 */
const calculateRentalOrderPricing = async (rawItems, sellerId, orderDurationDays = null, session = null) => {
  if (!Array.isArray(rawItems) || !rawItems.length) {
    throw new Error('Order items must be a non-empty array');
  }

  const sanitizedItems = rawItems.map((item, index) => {
    if (!item || !item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
      throw new Error(`Invalid productId at item index ${index}`);
    }
    const qty = validatePositiveInteger(item.qty || 1, `quantity for product ${item.productId}`, 500);
    const itemDays = item.days || item.rentalDays || orderDurationDays || 1;
    const days = validatePositiveInteger(itemDays, `rental days for product ${item.productId}`, 365);
    return { productId: item.productId.toString(), qty, days };
  });

  const productIds = sanitizedItems.map((i) => i.productId);
  const query = Product.find({
    _id: { $in: productIds },
    seller: sellerId,
  });
  if (session) query.session(session);

  const products = await query.lean();
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  let depositAmount = 0;
  const snapshotItems = [];

  for (const item of sanitizedItems) {
    const product = productMap[item.productId];
    if (!product) {
      throw new Error(`Product not found or does not belong to seller: ${item.productId}`);
    }
    if (product.type !== 'rental') {
      throw new Error(`Product ${product.title} is not a rental item`);
    }
    if (product.isAvailable === false) {
      throw new Error(`Product ${product.title} is currently unavailable for rental`);
    }

    const minRentalDays = Number(product.minRentalDays) || 1;
    if (item.days < minRentalDays) {
      throw new Error(`Minimum rental duration for ${product.title} is ${minRentalDays} day(s)`);
    }

    const pricePerDay = Number(product.rentalPrice || product.price);
    if (!Number.isFinite(pricePerDay) || pricePerDay < 0) {
      throw new Error(`Invalid authoritative rental rate for product ${product.title}`);
    }

    const unitDeposit = Number(product.deposit) || 0;
    const itemSubtotal = Math.round(pricePerDay * item.days * item.qty);
    const itemDeposit = Math.round(unitDeposit * item.qty);

    subtotal += itemSubtotal;
    depositAmount += itemDeposit;

    snapshotItems.push({
      product: product._id,
      title: product.title,
      image: product.images?.[0] || null,
      price: pricePerDay,
      unit: product.unit || 'day',
      qty: item.qty,
      days: item.days,
      subtotal: itemSubtotal,
    });
  }

  const deliveryCharge = calculateVendorDeliveryCharge(sellerId, 'rental');
  const total = subtotal + deliveryCharge;

  return {
    snapshotItems,
    subtotal,
    deliveryCharge,
    depositAmount,
    total,
    productMap,
  };
};

module.exports = {
  calculateMaterialOrderPricing,
  calculateRentalOrderPricing,
  calculateVendorDeliveryCharge,
  validatePositiveInteger,
  getAdminPricingConfig,
};
