const Worker = require('../models/Worker')
const Review = require('../models/Review')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getWorkers = async (req, res, next) => {
  try {
    const { search = '', status, category, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }
    if (status && status !== 'all') query.status = status
    if (category && category !== 'all') query.category = category

    const total = await Worker.countDocuments(query)
    const workers = await Worker.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, workers, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getWorkerById = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id)
    if (!worker) return next(createError(404, 'Worker not found.'))
    sendSuccess(res, 200, 'Worker fetched', { worker })
  } catch (err) {
    next(err)
  }
}

exports.updateWorkerStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const worker = await Worker.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
    if (!worker) return next(createError(404, 'Worker not found.'))
    req.auditTarget = `Worker #${req.params.id} - ${worker.fullName}`
    req.auditDetails = `Status changed to ${status}`
    sendSuccess(res, 200, 'Worker status updated', { worker })
  } catch (err) {
    next(err)
  }
}

exports.verifyWorker = async (req, res, next) => {
  try {
    const { aadhaar, pan, bank, documents } = req.body
    const worker = await Worker.findById(req.params.id)
    if (!worker) return next(createError(404, 'Worker not found.'))

    if (aadhaar !== undefined) worker.verification.aadhaar = aadhaar
    if (pan !== undefined) worker.verification.pan = pan
    if (bank !== undefined) worker.verification.bank = bank
    if (documents !== undefined) worker.verification.documents = documents

    const allVerified = worker.verification.aadhaar && worker.verification.pan && worker.verification.bank && worker.verification.documents
    if (allVerified) {
      worker.isVerified = true
      if (worker.status === 'pending_verification') worker.status = 'active'
    }

    await worker.save()
    req.auditTarget = `Worker #${req.params.id} - ${worker.fullName}`
    req.auditDetails = `Verification updated: ${JSON.stringify(worker.verification)}`
    sendSuccess(res, 200, 'Worker verification updated', { worker })
  } catch (err) {
    next(err)
  }
}

exports.getWorkerEarnings = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id).select('earnings fullName')
    if (!worker) return next(createError(404, 'Worker not found.'))
    sendSuccess(res, 200, 'Worker earnings fetched', { earnings: worker.earnings, worker: { name: worker.fullName } })
  } catch (err) {
    next(err)
  }
}

exports.getWorkerRatings = async (req, res, next) => {
  try {
    const ratings = await Review.find({ entityType: 'worker', entityId: req.params.id }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Worker ratings fetched', { ratings })
  } catch (err) {
    next(err)
  }
}

exports.getPendingVerifications = async (req, res, next) => {
  try {
    const workers = await Worker.find({ status: 'pending_verification' }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Pending verifications fetched', { workers })
  } catch (err) {
    next(err)
  }
}