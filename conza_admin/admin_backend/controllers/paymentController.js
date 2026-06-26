const Transaction = require('../models/Transaction')
const { sendSuccess, sendPaginated } = require('../utils/response')

const getPayments = (filter = {}) => async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 20 } = req.query
    const query = { ...filter }
    if (search) query.$or = [{ user: { $regex: search, $options: 'i' } }, { referenceId: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status

    const total = await Transaction.countDocuments(query)
    const payments = await Transaction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, payments, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getRazorpayPayments = getPayments({ method: 'razorpay' })
exports.getFailedPayments = getPayments({ status: 'failed' })
exports.getRefundRequests = getPayments({ status: 'refunded' })
exports.getCashPayments = getPayments({ method: 'cash' })
exports.getUPIPayments = getPayments({ method: 'upi' })
