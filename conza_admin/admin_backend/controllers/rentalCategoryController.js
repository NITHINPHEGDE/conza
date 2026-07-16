const RentalCategory = require('../models/RentalCategory')
const Product = require('../models/Product')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../middleware/cloudinaryUpload')

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

exports.getCategories = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query
    const query = {}
    if (search) query.name = { $regex: search, $options: 'i' }

    const total = await RentalCategory.countDocuments(query)
    const categories = await RentalCategory.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean()

    // Live rental-item count per category so the table column stays real.
    const withCounts = await Promise.all(
      categories.map(async (c) => ({
        ...c,
        items: await Product.countDocuments({ type: 'rental', category: c.name }),
      }))
    )

    sendPaginated(res, withCounts, total, page, limit)
  } catch (err) {
    next(err)
  }
}

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await RentalCategory.findById(req.params.id)
    if (!category) return next(createError(404, 'Category not found.'))
    sendSuccess(res, 200, 'Category fetched', { category })
  } catch (err) {
    next(err)
  }
}

exports.createCategory = async (req, res, next) => {
  try {
    const { name, image, active, description } = req.body
    if (!name || !name.trim()) return next(createError(400, 'Category title is required.'))
    if (!image) return next(createError(400, 'Category image is required.'))

    const duplicate = await RentalCategory.findOne({
      name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' },
    })
    if (duplicate) return next(createError(400, 'A category with this title already exists.'))

    // If the frontend sent a base64 data-URI, upload it to Cloudinary.
    // If it already sent a Cloudinary URL (e.g. re-submitting), use it as-is.
    const imageUrl = image.startsWith('data:')
      ? await uploadToCloudinary(image, 'conza/rental-categories')
      : image

    const category = await RentalCategory.create({
      name: name.trim(),
      image: imageUrl,
      active: active !== undefined ? active : true,
      description: description || '',
    })
    req.auditTarget = `Rental Category - ${category.name}`
    req.auditDetails = 'Created rental category'
    sendSuccess(res, 201, 'Category created', { category })
  } catch (err) {
    next(err)
  }
}

exports.updateCategory = async (req, res, next) => {
  try {
    const existing = await RentalCategory.findById(req.params.id)
    if (!existing) return next(createError(404, 'Category not found.'))

    const { name, image, active, description } = req.body
    const updates = {}

    if (name !== undefined) {
      const trimmed = String(name).trim()
      if (!trimmed) return next(createError(400, 'Category title cannot be empty.'))
      const duplicate = await RentalCategory.findOne({
        _id: { $ne: existing._id },
        name: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' },
      })
      if (duplicate) return next(createError(400, 'A category with this title already exists.'))
      updates.name = trimmed
    }

    if (description !== undefined) updates.description = description
    if (active !== undefined) updates.active = active

    if (image && image.startsWith('data:')) {
      const newImageUrl = await uploadToCloudinary(image, 'conza/rental-categories')
      const oldPublicId = extractPublicId(existing.image)
      if (oldPublicId) {
        deleteFromCloudinary(oldPublicId).catch(() => {}) // best-effort, don't block the response
      }
      updates.image = newImageUrl
    } else if (image) {
      updates.image = image
    }

    const category = await RentalCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    req.auditTarget = `Rental Category #${req.params.id} - ${category.name}`
    req.auditDetails = 'Updated rental category'
    sendSuccess(res, 200, 'Category updated', { category })
  } catch (err) {
    next(err)
  }
}

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await RentalCategory.findByIdAndDelete(req.params.id)
    if (!category) return next(createError(404, 'Category not found.'))
    const publicId = extractPublicId(category.image)
    if (publicId) deleteFromCloudinary(publicId).catch(() => {})
    req.auditTarget = `Rental Category #${req.params.id}`
    req.auditDetails = 'Rental category deleted'
    sendSuccess(res, 200, 'Category deleted')
  } catch (err) {
    next(err)
  }
}
