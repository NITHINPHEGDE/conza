const Wallet   = require('../models/Wallet')
const Customer = require('../models/Customer')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

// ── Customer wallets — read directly from real customers DB ──────────────────
exports.getCustomerWallets = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query
    const pageNum  = parseInt(page)
    const limitNum = parseInt(limit)

    const query = {}
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone:    { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
      ]
    }

    const total     = await Customer.countDocuments(query)
    const customers = await Customer.find(query)
      .select('fullName phone email walletBalance status')
      .sort({ walletBalance: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    // Map to the same shape CustomerWallets.jsx expects
    const data = customers.map((c) => ({
      _id:        c._id,
      ownerId:    c._id,
      ownerName:  c.fullName || c.email || 'Unknown',
      ownerPhone: c.phone || '',
      ownerType:  'customer',
      balance:    c.walletBalance ?? 0,
      totalCredit: 0,   // not tracked per-customer; use Wallet doc if needed
      totalDebit:  0,
    }))

    sendPaginated(res, data, total, pageNum, limitNum)
  } catch (err) {
    next(err)
  }
}

// ── Worker / Vendor / BP wallets — read from Wallet collection ───────────────
const getWallets = (ownerType) => async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query
    const query = { ownerType }
    if (search) query.ownerName = { $regex: search, $options: 'i' }

    const total = await Wallet.countDocuments(query)
    const wallets = await Wallet.find(query).sort({ balance: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, wallets, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getWorkerWallets = getWallets('worker')
exports.getVendorWallets = getWallets('vendor')
exports.getBPWallets = getWallets('business_partner')

exports.creditWallet = async (req, res, next) => {
  try {
    const { amount, description } = req.body
    if (!amount || amount <= 0) return next(createError(400, 'Valid amount is required.'))

    // Try Wallet collection first (workers, vendors, BPs)
    let wallet = await Wallet.findByIdAndUpdate(req.params.id, {
      $inc: { balance: amount, totalCredit: amount },
      $push: { transactions: { type: 'credit', amount, description: description || 'Admin credit' } },
    }, { new: true })

    if (wallet) {
      // Wallet doc found — also sync Customer if ownerType is customer
      if (wallet.ownerType === 'customer') {
        await Customer.findByIdAndUpdate(wallet.ownerId, { $inc: { walletBalance: amount } })
      }
      req.auditTarget = `Wallet - ${wallet.ownerName}`
      req.auditDetails = `Credited ₹${amount}: ${description}`
      return sendSuccess(res, 200, 'Wallet credited', { wallet })
    }

    // No Wallet doc → treat id as a Customer _id directly
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $inc: { walletBalance: amount } },
      { new: true }
    ).select('fullName phone walletBalance')
    if (!customer) return next(createError(404, 'Customer not found.'))

    req.auditTarget = `Customer Wallet - ${customer.fullName}`
    req.auditDetails = `Credited ₹${amount}: ${description}`
    sendSuccess(res, 200, 'Wallet credited', {
      wallet: {
        _id: customer._id,
        ownerId: customer._id,
        ownerName: customer.fullName,
        ownerType: 'customer',
        balance: customer.walletBalance,
      },
    })
  } catch (err) {
    next(err)
  }
}

exports.debitWallet = async (req, res, next) => {
  try {
    const { amount, description } = req.body
    if (!amount || amount <= 0) return next(createError(400, 'Valid amount is required.'))

    // Try Wallet collection first (workers, vendors, BPs)
    const existingWallet = await Wallet.findById(req.params.id)

    if (existingWallet) {
      if (existingWallet.balance < amount) return next(createError(400, 'Insufficient wallet balance.'))
      existingWallet.balance -= amount
      existingWallet.totalDebit += amount
      existingWallet.transactions.push({ type: 'debit', amount, description: description || 'Admin debit' })
      await existingWallet.save()

      if (existingWallet.ownerType === 'customer') {
        await Customer.findByIdAndUpdate(existingWallet.ownerId, { $inc: { walletBalance: -amount } })
      }

      req.auditTarget = `Wallet - ${existingWallet.ownerName}`
      req.auditDetails = `Debited ₹${amount}: ${description}`
      return sendSuccess(res, 200, 'Wallet debited', { wallet: existingWallet })
    }

    // No Wallet doc → treat id as a Customer _id directly
    const customer = await Customer.findById(req.params.id).select('fullName phone walletBalance')
    if (!customer) return next(createError(404, 'Customer not found.'))
    if ((customer.walletBalance ?? 0) < amount) return next(createError(400, 'Insufficient wallet balance.'))

    customer.walletBalance -= amount
    await Customer.findByIdAndUpdate(req.params.id, { $inc: { walletBalance: -amount } })

    req.auditTarget = `Customer Wallet - ${customer.fullName}`
    req.auditDetails = `Debited ₹${amount}: ${description}`
    sendSuccess(res, 200, 'Wallet debited', {
      wallet: {
        _id: customer._id,
        ownerId: customer._id,
        ownerName: customer.fullName,
        ownerType: 'customer',
        balance: customer.walletBalance - amount,
      },
    })
  } catch (err) {
    next(err)
  }
}