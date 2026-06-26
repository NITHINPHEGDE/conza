const Booking = require('../models/Booking')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getBookings = async (req, res, next) => {
  try {
    const { search = '', status, type, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.$or = [{ user: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status
    if (type && type !== 'all') query.bookingType = type

    const total = await Booking.countDocuments(query)
    const bookings = await Booking.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, bookings, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return next(createError(404, 'Booking not found.'))
    sendSuccess(res, 200, 'Booking fetched', { booking })
  } catch (err) {
    next(err)
  }
}

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!booking) return next(createError(404, 'Booking not found.'))
    req.auditTarget = `Booking #${req.params.id}`
    req.auditDetails = `Status changed to ${status}`
    sendSuccess(res, 200, 'Booking status updated', { booking })
  } catch (err) {
    next(err)
  }
}

exports.assignWorker = async (req, res, next) => {
  try {
    const { workerId } = req.body
    const booking = await Booking.findById(req.params.id)
    if (!booking) return next(createError(404, 'Booking not found.'))
    if (!booking.workers.includes(workerId)) booking.workers.push(workerId)
    await booking.save()
    req.auditTarget = `Booking #${req.params.id}`
    req.auditDetails = `Worker ${workerId} assigned`
    sendSuccess(res, 200, 'Worker assigned to booking', { booking })
  } catch (err) {
    next(err)
  }
}

exports.resolveDispute = async (req, res, next) => {
  try {
    const { resolution } = req.body
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { disputeResolution: resolution, status: 'completed' },
      { new: true }
    )
    if (!booking) return next(createError(404, 'Booking not found.'))
    req.auditTarget = `Booking #${req.params.id}`
    req.auditDetails = `Dispute resolved: ${resolution}`
    sendSuccess(res, 200, 'Dispute resolved', { booking })
  } catch (err) {
    next(err)
  }
}

exports.getBookingTimeline = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return next(createError(404, 'Booking not found.'))
    const timeline = [
      { status: 'pending', timestamp: booking.createdAt, note: 'Booking created' },
      ...(booking.acceptedAt ? [{ status: 'accepted', timestamp: booking.acceptedAt, note: 'Worker accepted' }] : []),
      ...(booking.checkInTime ? [{ status: 'in_progress', timestamp: booking.checkInTime, note: 'Work started' }] : []),
      ...(booking.checkOutTime ? [{ status: 'completed', timestamp: booking.checkOutTime, note: 'Work completed' }] : []),
    ]
    sendSuccess(res, 200, 'Timeline fetched', { timeline, booking })
  } catch (err) {
    next(err)
  }
}

exports.getDisputes = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ status: 'disputed' }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Disputes fetched', { bookings })
  } catch (err) {
    next(err)
  }
}
