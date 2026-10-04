// conza_customers/conza_backend/models/WalletTransaction.js
//
// Immutable wallet ledger for the customer database.
//
// Design principles:
//  1. IMMUTABLE — documents are never updated after creation. A refund is a
//     new 'refund' document, not a mutation of the original debit.
//  2. LINKED — every transaction carries a referenceType/referenceId so any
//     balance change can be traced back to the business operation that caused it.
//  3. AUDITABLE — balanceBefore and balanceAfter are recorded server-side at
//     write time, never supplied by the client.
//  4. IDEMPOTENT — an idempotencyKey (sparse, unique) prevents duplicate
//     ledger entries on network retry.
//  5. NO updatedAt — the schema uses { timestamps: false } and only sets
//     createdAt manually to make the immutability intent explicit.
//

'use strict';

const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    // ── Who ─────────────────────────────────────────────────────────────────
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ── What ─────────────────────────────────────────────────────────────────
    // 'debit'      — money leaves the wallet (booking payment, admin debit)
    // 'credit'     — money enters the wallet (admin top-up, promo)
    // 'refund'     — reversal credit linked to an earlier debit
    // 'adjustment' — manual correction by admin
    type: {
      type:     String,
      enum:     ['debit', 'credit', 'refund', 'adjustment'],
      required: true,
    },

    // Redundant with `type` but makes queries simpler
    direction: {
      type:     String,
      enum:     ['in', 'out'],
      required: true,
    },

    // Always positive regardless of direction
    amount: {
      type:     Number,
      required: true,
      min:      0,
    },

    // ── Snapshot ─────────────────────────────────────────────────────────────
    // Calculated server-side at write time; never supplied by client.
    balanceBefore: { type: Number, required: true },
    balanceAfter:  { type: Number, required: true },

    // ── Why ───────────────────────────────────────────────────────────────────
    // referenceType identifies the collection; referenceId identifies the doc.
    // Combined they answer "why was this money moved?"
    referenceType: {
      type: String,
      enum: ['Booking', 'SellerOrder', 'Admin', 'System', null],
      default: null,
    },
    referenceId: { type: String, default: null },

    description: { type: String, default: '' },

    // ── Status ───────────────────────────────────────────────────────────────
    // 'completed' — the corresponding database operation succeeded
    // 'failed'    — the operation was aborted; balance was NOT changed
    //               (recorded for audit purposes)
    // 'reversed'  — a subsequent refund has been recorded for this entry
    status: {
      type:    String,
      enum:    ['completed', 'failed', 'reversed'],
      default: 'completed',
    },

    // ── Idempotency ──────────────────────────────────────────────────────────
    // Prevents duplicate ledger entries on network retry.
    // Clients may supply this in the request; it must be a UUID or similar
    // stable identifier (NOT a timestamp).
    idempotencyKey: {
      type:   String,
      sparse: true,
      index:  true,
    },

    // ── Free-form metadata ───────────────────────────────────────────────────
    // Store anything useful for debugging: IP, device, admin who triggered it, etc.
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Immutable timestamp ───────────────────────────────────────────────────
    createdAt: {
      type:      Date,
      default:   Date.now,
      immutable: true,
    },
  },
  {
    // updatedAt deliberately omitted — records are append-only
    timestamps: false,
    // Prevent accidental full-document replacement
    strict: true,
  }
);

// ── Compound indexes ──────────────────────────────────────────────────────────
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ referenceType: 1, referenceId: 1 });
walletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

// ── Guard: prevent any update on a committed ledger entry ────────────────────
walletTransactionSchema.pre('findOneAndUpdate', function () {
  throw new Error('WalletTransaction records are immutable. Create a new record instead.');
});
walletTransactionSchema.pre('updateOne', function () {
  throw new Error('WalletTransaction records are immutable. Create a new record instead.');
});
walletTransactionSchema.pre('updateMany', function () {
  throw new Error('WalletTransaction records are immutable. Create a new record instead.');
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
