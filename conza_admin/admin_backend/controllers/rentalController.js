const Rental = require('../models/Rental')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getRentals = async (req, res, next) => {
  try {
    const { search = '', status, category, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { vendor: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status
    if (category && category !== 'all') query.category = category

    const total = await Rental.countDocuments(query)
    const rentals = await Rental.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, rentals, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getRentalById = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id)
    if (!rental) return next(createError(404, 'Rental not found.'))
    sendSuccess(res, 200, 'Rental fetched', { rental })
  } catch (err) {
    next(err)
  }
}

exports.updateRental = async (req, res, next) => {
  try {
    const rental = await Rental.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!rental) return next(createError(404, 'Rental not found.'))
    sendSuccess(res, 200, 'Rental updated', { rental })
  } catch (err) {
    next(err)
  }
}

exports.deleteRental = async (req, res, next) => {
  try {
    const rental = await Rental.findByIdAndDelete(req.params.id)
    if (!rental) return next(createError(404, 'Rental not found.'))
    sendSuccess(res, 200, 'Rental deleted')
  } catch (err) {
    next(err)
  }
}

exports.getFeaturedRentals = async (req, res, next) => {
  try {
    const rentals = await Rental.find({ isFeatured: true }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Featured rentals fetched', { rentals })
  } catch (err) {
    next(err)
  }
}

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Rental.distinct('category')
    sendSuccess(res, 200, 'Rental categories fetched', { categories })
  } catch (err) {
    next(err)
  }
}
