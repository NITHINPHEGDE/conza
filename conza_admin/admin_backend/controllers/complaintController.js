const Complaint = require('../models/Complaint')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

const getComplaints = (filter = {}) => async (req, res, next) => {
  try {
    const { search = '', status, priority, page = 1, limit = 20 } = req.query
    const query = { ...filter }
    if (search) query.$or = [{ user: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status
    if (priority && priority !== 'all') query.priority = priority

    const total = await Complaint.countDocuments(query)
    const complaints = await Complaint.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, complaints, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getAllComplaints = getComplaints()
exports.getTickets = getComplaints({ type: { $in: ['app', 'other'] } })
exports.getEscalations = getComplaints({ isEscalated: true })
exports.getRefundCases = getComplaints({ type: 'payment' })

exports.getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) return next(createError(404, 'Complaint not found.'))
    sendSuccess(res, 200, 'Complaint fetched', { complaint })
  } catch (err) {
    next(err)
  }
}

exports.updateComplaint = async (req, res, next) => {
  try {
    const { status, resolution, assignedTo, priority } = req.body
    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) return next(createError(404, 'Complaint not found.'))

    if (status) complaint.status = status
    if (resolution) complaint.resolution = resolution
    if (assignedTo) complaint.assignedTo = assignedTo
    if (priority) complaint.priority = priority
    if (status === 'escalated') complaint.isEscalated = true

    await complaint.save()
    req.auditTarget = `Complaint #${req.params.id}`
    req.auditDetails = `Complaint updated: status=${complaint.status}`
    sendSuccess(res, 200, 'Complaint updated', { complaint })
  } catch (err) {
    next(err)
  }
}
