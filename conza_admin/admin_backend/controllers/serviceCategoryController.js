const ServiceCategory = require('../models/ServiceCategory')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getCategories = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query
    const query = {}
    if (search) query.name = { $regex: search, $options: 'i' }

    const total = await ServiceCategory.countDocuments(query)
    const categories = await ServiceCategory.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, categories, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.createCategory = async (req, res, next) => {
  try {
    const { name, baseCharge, commission, radius } = req.body
    if (!name || !baseCharge) return next(createError(400, 'Name and base charge are required.'))

    const category = await ServiceCategory.create({ name, baseCharge, commission: commission || 15, radius: radius || 5 })
    req.auditTarget = `Service Category - ${name}`
    req.auditDetails = `Created service category with base charge ₹${baseCharge}`
    sendSuccess(res, 201, 'Category created', { category })
  } catch (err) {
    next(err)
  }
}

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!category) return next(createError(404, 'Category not found.'))
    req.auditTarget = `Service Category #${req.params.id} - ${category.name}`
    req.auditDetails = `Updated category`
    sendSuccess(res, 200, 'Category updated', { category })
  } catch (err) {
    next(err)
  }
}

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndDelete(req.params.id)
    if (!category) return next(createError(404, 'Category not found.'))
    req.auditTarget = `Service Category #${req.params.id}`
    req.auditDetails = `Category deleted`
    sendSuccess(res, 200, 'Category deleted')
  } catch (err) {
    next(err)
  }
}

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findById(req.params.id)
    if (!category) return next(createError(404, 'Category not found.'))
    sendSuccess(res, 200, 'Category fetched', { category })
  } catch (err) {
    next(err)
  }
}
