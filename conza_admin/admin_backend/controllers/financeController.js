const Transaction = require('../models/Transaction')
const Payout = require('../models/Payout')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')
const { mockRevenueSummary } = require('../utils/mockData')

exports.getRevenue = async (req, res, next) => {
  try {
    const { period = 'weekly' } = req.query
    const result = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    const totalRevenue = result[0]?.total || 0

    const summary = totalRevenue > 0
      ? { ...mockRevenueSummary, totalRevenue }
      : mockRevenueSummary

    sendSuccess(res, 200, 'Revenue fetched', { revenue: summary, period })
  } catch (err) {
    next(err)
  }
}

exports.getTransactions = async (req, res, next) => {
  try {
    const { search = '', status, type, method, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.$or = [{ user: { $regex: search, $options: 'i' } }, { referenceId: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status
    if (type && type !== 'all') query.type = type
    if (method && method !== 'all') query.method = method

    const total = await Transaction.countDocuments(query)
    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, transactions, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getPayouts = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query
    const query = {}
    if (status && status !== 'all') query.status = status
    if (type && type !== 'all') query.type = type

    const total = await Payout.countDocuments(query)
    const payouts = await Payout.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, payouts, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.approvePayout = async (req, res, next) => {
  try {
    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      { status: 'processing', processedBy: req.admin.name, processedAt: new Date() },
      { new: true }
    )
    if (!payout) return next(createError(404, 'Payout not found.'))
    req.auditTarget = `Payout #${req.params.id} - ${payout.recipient}`
    req.auditDetails = `Payout of ₹${payout.amount} approved`
    sendSuccess(res, 200, 'Payout approved', { payout })
  } catch (err) {
    next(err)
  }
}

exports.getReports = async (req, res, next) => {
  try {
    const { type = 'revenue' } = req.query
    const data = { type, generatedAt: new Date(), ...mockRevenueSummary }
    sendSuccess(res, 200, 'Reports fetched', { report: data })
  } catch (err) {
    next(err)
  }
}

exports.getCommissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const transactions = await Transaction.find({ status: 'success' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    const commissions = transactions.map(t => ({
      id: t._id,
      source: `${t.type.charAt(0).toUpperCase() + t.type.slice(1)} #${t._id}`,
      amount: Math.round(t.amount * 0.1),
      type: t.type,
      date: t.createdAt,
    }))

    sendSuccess(res, 200, 'Commissions fetched', { commissions })
  } catch (err) {
    next(err)
  }
}
