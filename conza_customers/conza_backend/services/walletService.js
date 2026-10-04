// conza_customers/conza_backend/services/walletService.js
//
// Centralised, atomic wallet mutation service.
//
// INVARIANTS ENFORCED
// ───────────────────
//  1. The database is the sole source of financial truth.
//     No application-level balance read is trusted for correctness.
//
//  2. All debits use a single findOneAndUpdate with a { walletBalance: { $gte: amount } }
//     condition, making the check and the decrement one indivisible operation.
//     Two concurrent requests can NEVER both pass the balance check for the same funds.
//
//  3. Every balance mutation creates a WalletTransaction ledger entry in the
//     SAME MongoDB session (transaction). If the ledger write fails the balance
//     change is rolled back automatically.
//
//  4. Idempotency — if the caller supplies an idempotencyKey that already exists
//     in WalletTransaction, the existing entry is returned and no money moves.
//
//  5. Callers are responsible for starting/committing the session that wraps the
//     wallet operation and the associated business operation (booking/order).
//     This service only adds its operations to the provided session.
//

'use strict';

const User              = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const logger            = require('../utils/logger');

/**
 * Atomically debit a customer's wallet.
 *
 * MUST be called inside an active MongoDB session/transaction.
 * The caller commits or aborts the transaction.
 *
 * @param {object} params
 * @param {string|ObjectId} params.userId
 * @param {number}          params.amount        - positive number, in rupees
 * @param {string}          params.referenceType - 'Booking' | 'SellerOrder' | 'Admin' | 'System'
 * @param {string}          params.referenceId   - _id of the associated document
 * @param {string}          params.description
 * @param {string}          [params.idempotencyKey]
 * @param {object}          [params.metadata]
 * @param {import('mongoose').ClientSession} params.session - REQUIRED
 *
 * @returns {{ ledger: WalletTransaction, balanceAfter: number }}
 * @throws  If balance is insufficient, user not found, or idempotencyKey already used.
 */
const debitWallet = async ({
  userId,
  amount,
  referenceType,
  referenceId,
  description = '',
  idempotencyKey = null,
  metadata = {},
  session,
}) => {
  if (!session) throw new Error('walletService.debitWallet requires a MongoDB session');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Debit amount must be a positive number');

  // ── Idempotency check ─────────────────────────────────────────────────────
  if (idempotencyKey) {
    const existing = await WalletTransaction.findOne({ idempotencyKey }).session(session).lean();
    if (existing) {
      logger.info({ idempotencyKey, userId }, 'walletService.debitWallet: idempotent replay — no money moved');
      return { ledger: existing, balanceAfter: existing.balanceAfter, idempotentReplay: true };
    }
  }

  // ── Atomic debit: check + decrement in one operation ─────────────────────
  // If walletBalance < amount this returns null and we reject.
  // No separate read is done — this is the ONLY way to touch the balance.
  const updatedUser = await User.findOneAndUpdate(
    {
      _id:           userId,
      walletBalance: { $gte: amount },   // atomic guard — prevents negative balance
    },
    { $inc: { walletBalance: -amount } },
    { session, new: true }
  ).select('walletBalance').lean();

  if (!updatedUser) {
    // Either the user doesn't exist or balance < amount.
    // Distinguish the two for a better error message.
    const exists = await User.exists({ _id: userId }).session(session);
    if (!exists) throw new Error('User not found');
    throw new Error('Insufficient wallet balance');
  }

  const balanceAfter  = updatedUser.walletBalance;
  const balanceBefore = balanceAfter + amount;   // recover from atomic result

  // ── Record in the ledger (same session — rolls back with the debit) ───────
  const [ledger] = await WalletTransaction.create(
    [
      {
        user:          userId,
        type:          'debit',
        direction:     'out',
        amount,
        balanceBefore,
        balanceAfter,
        referenceType: referenceType || null,
        referenceId:   referenceId   ? String(referenceId) : null,
        description,
        status:        'completed',
        idempotencyKey: idempotencyKey || undefined,
        metadata,
      },
    ],
    { session }
  );

  logger.info({ userId, amount, balanceAfter, referenceType, referenceId }, 'Wallet debited');
  return { ledger, balanceAfter };
};

/**
 * Credit a customer's wallet.
 *
 * MUST be called inside an active MongoDB session/transaction.
 *
 * @param {object} params
 * @param {string|ObjectId} params.userId
 * @param {number}          params.amount
 * @param {string}          params.referenceType
 * @param {string}          params.referenceId
 * @param {string}          params.description
 * @param {string}          [params.idempotencyKey]
 * @param {object}          [params.metadata]
 * @param {import('mongoose').ClientSession} params.session
 *
 * @returns {{ ledger: WalletTransaction, balanceAfter: number }}
 */
const creditWallet = async ({
  userId,
  amount,
  referenceType,
  referenceId,
  description = '',
  idempotencyKey = null,
  metadata = {},
  session,
}) => {
  if (!session) throw new Error('walletService.creditWallet requires a MongoDB session');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Credit amount must be a positive number');

  // ── Idempotency check ─────────────────────────────────────────────────────
  if (idempotencyKey) {
    const existing = await WalletTransaction.findOne({ idempotencyKey }).session(session).lean();
    if (existing) {
      logger.info({ idempotencyKey, userId }, 'walletService.creditWallet: idempotent replay — no money moved');
      return { ledger: existing, balanceAfter: existing.balanceAfter, idempotentReplay: true };
    }
  }

  // ── Atomic credit ─────────────────────────────────────────────────────────
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { walletBalance: amount } },
    { session, new: true }
  ).select('walletBalance').lean();

  if (!updatedUser) throw new Error('User not found');

  const balanceAfter  = updatedUser.walletBalance;
  const balanceBefore = balanceAfter - amount;

  // ── Record in the ledger ──────────────────────────────────────────────────
  const [ledger] = await WalletTransaction.create(
    [
      {
        user:          userId,
        type:          'credit',
        direction:     'in',
        amount,
        balanceBefore,
        balanceAfter,
        referenceType: referenceType || null,
        referenceId:   referenceId   ? String(referenceId) : null,
        description,
        status:        'completed',
        idempotencyKey: idempotencyKey || undefined,
        metadata,
      },
    ],
    { session }
  );

  logger.info({ userId, amount, balanceAfter, referenceType, referenceId }, 'Wallet credited');
  return { ledger, balanceAfter };
};

/**
 * Record a refund credit that is explicitly linked to the original debit entry.
 *
 * MUST be called inside an active MongoDB session/transaction.
 *
 * @param {object} params
 * @param {string|ObjectId} params.userId
 * @param {number}          params.amount
 * @param {string}          params.originalLedgerId - _id of the WalletTransaction being reversed
 * @param {string}          params.referenceType
 * @param {string}          params.referenceId
 * @param {string}          params.description
 * @param {string}          [params.idempotencyKey]
 * @param {import('mongoose').ClientSession} params.session
 *
 * @returns {{ ledger: WalletTransaction, balanceAfter: number }}
 */
const refundWallet = async ({
  userId,
  amount,
  originalLedgerId,
  referenceType,
  referenceId,
  description = 'Refund',
  idempotencyKey = null,
  session,
}) => {
  if (!session) throw new Error('walletService.refundWallet requires a MongoDB session');

  // ── Idempotency check ─────────────────────────────────────────────────────
  if (idempotencyKey) {
    const existing = await WalletTransaction.findOne({ idempotencyKey }).session(session).lean();
    if (existing) {
      return { ledger: existing, balanceAfter: existing.balanceAfter, idempotentReplay: true };
    }
  }

  // ── Atomic credit ─────────────────────────────────────────────────────────
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { walletBalance: amount } },
    { session, new: true }
  ).select('walletBalance').lean();

  if (!updatedUser) throw new Error('User not found');

  const balanceAfter  = updatedUser.walletBalance;
  const balanceBefore = balanceAfter - amount;

  // ── Record refund in the ledger ───────────────────────────────────────────
  const [ledger] = await WalletTransaction.create(
    [
      {
        user:          userId,
        type:          'refund',
        direction:     'in',
        amount,
        balanceBefore,
        balanceAfter,
        referenceType: referenceType || null,
        referenceId:   referenceId   ? String(referenceId) : null,
        description,
        status:        'completed',
        idempotencyKey: idempotencyKey || undefined,
        metadata:      { originalLedgerId: originalLedgerId ? String(originalLedgerId) : null },
      },
    ],
    { session }
  );

  logger.info({ userId, amount, balanceAfter, originalLedgerId }, 'Wallet refunded');
  return { ledger, balanceAfter };
};

module.exports = { debitWallet, creditWallet, refundWallet };
