const Wallet = require('../models/Wallet')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

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

exports.getCustomerWallets = getWallets('customer')
exports.getWorkerWallets = getWallets('worker')
exports.getVendorWallets = getWallets('vendor')
exports.getBPWallets = getWallets('business_partner')

exports.creditWallet = async (req, res, next) => {
  try {
    const { amount, description } = req.body
    if (!amount || amount <= 0) return next(createError(400, 'Valid amount is required.'))

    const wallet = await Wallet.findByIdAndUpdate(req.params.id, {
      $inc: { balance: amount, totalCredit: amount },
      $push: { transactions: { type: 'credit', amount, description: description || 'Admin credit' } },
    }, { new: true })

    if (!wallet) return next(createError(404, 'Wallet not found.'))
    req.auditTarget = `Wallet #${req.params.id} - ${wallet.ownerName}`
    req.auditDetails = `Credited ₹${amount}: ${description}`
    sendSuccess(res, 200, 'Wallet credited', { wallet })
  } catch (err) {
    next(err)
  }
}

exports.debitWallet = async (req, res, next) => {
  try {
    const { amount, description } = req.body
    if (!amount || amount <= 0) return next(createError(400, 'Valid amount is required.'))

    const wallet = await Wallet.findById(req.params.id)
    if (!wallet) return next(createError(404, 'Wallet not found.'))
    if (wallet.balance < amount) return next(createError(400, 'Insufficient wallet balance.'))

    wallet.balance -= amount
    wallet.totalDebit += amount
    wallet.transactions.push({ type: 'debit', amount, description: description || 'Admin debit' })
    await wallet.save()

    req.auditTarget = `Wallet #${req.params.id} - ${wallet.ownerName}`
    req.auditDetails = `Debited ₹${amount}: ${description}`
    sendSuccess(res, 200, 'Wallet debited', { wallet })
  } catch (err) {
    next(err)
  }
}