const Material = require('../models/Material')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.getMaterials = async (req, res, next) => {
  try {
    const { search = '', status, category, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { vendor: { $regex: search, $options: 'i' } }]
    if (status && status !== 'all') query.status = status
    if (category && category !== 'all') query.category = category

    const total = await Material.countDocuments(query)
    const materials = await Material.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, materials, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getMaterialById = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return next(createError(404, 'Material not found.'))
    sendSuccess(res, 200, 'Material fetched', { material })
  } catch (err) {
    next(err)
  }
}

exports.updateMaterial = async (req, res, next) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!material) return next(createError(404, 'Material not found.'))
    sendSuccess(res, 200, 'Material updated', { material })
  } catch (err) {
    next(err)
  }
}

exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id)
    if (!material) return next(createError(404, 'Material not found.'))
    req.auditTarget = `Material #${req.params.id} - ${material.name}`
    req.auditDetails = `Material listing removed`
    sendSuccess(res, 200, 'Material deleted')
  } catch (err) {
    next(err)
  }
}

exports.getFeaturedMaterials = async (req, res, next) => {
  try {
    const materials = await Material.find({ isFeatured: true }).sort({ createdAt: -1 })
    sendSuccess(res, 200, 'Featured materials fetched', { materials })
  } catch (err) {
    next(err)
  }
}

exports.toggleFeatured = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return next(createError(404, 'Material not found.'))
    material.isFeatured = !material.isFeatured
    await material.save()
    sendSuccess(res, 200, `Material ${material.isFeatured ? 'featured' : 'unfeatured'}`, { material })
  } catch (err) {
    next(err)
  }
}

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Material.distinct('category')
    sendSuccess(res, 200, 'Material categories fetched', { categories })
  } catch (err) {
    next(err)
  }
}

exports.getLowStock = async (req, res, next) => {
  try {
    const materials = await Material.find({ $expr: { $lte: ['$stock', '$threshold'] }, status: { $ne: 'out_of_stock' } })
    sendSuccess(res, 200, 'Low stock materials fetched', { materials })
  } catch (err) {
    next(err)
  }
}

exports.getOutOfStock = async (req, res, next) => {
  try {
    const materials = await Material.find({ $or: [{ stock: 0 }, { status: 'out_of_stock' }] })
    sendSuccess(res, 200, 'Out of stock materials fetched', { materials })
  } catch (err) {
    next(err)
  }
}
