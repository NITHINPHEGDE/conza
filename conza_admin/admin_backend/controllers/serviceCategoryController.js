const ServiceCategory = require('../models/ServiceCategory')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../middleware/cloudinaryUpload')

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
    const { name, image, commission, radius, description } = req.body
    if (!name || !image) return next(createError(400, 'Name and service image are required.'))

    // If the frontend sent a base64 data-URI, upload it to Cloudinary.
    // If it already sent a Cloudinary URL (e.g. re-submitting), just use it as-is.
    const imageUrl = image.startsWith('data:')
      ? await uploadToCloudinary(image, 'conza/services')
      : image

    const category = await ServiceCategory.create({
      name,
      image: imageUrl,
      commission: commission || 15,
      radius: radius || 5,
      description: description || '',
    })
    req.auditTarget = `Service Category - ${name}`
    req.auditDetails = `Created service category`
    sendSuccess(res, 201, 'Category created', { category })
  } catch (err) {
    next(err)
  }
}

exports.updateCategory = async (req, res, next) => {
  try {
    const existing = await ServiceCategory.findById(req.params.id)
    if (!existing) return next(createError(404, 'Category not found.'))

    const updates = { ...req.body }

    if (updates.image && updates.image.startsWith('data:')) {
      const newImageUrl = await uploadToCloudinary(updates.image, 'conza/services')
      const oldPublicId = extractPublicId(existing.image)
      if (oldPublicId) {
        deleteFromCloudinary(oldPublicId).catch(() => {}) // best-effort, don't block the response
      }
      updates.image = newImageUrl
    }

    delete updates.baseCharge // no longer a valid field

    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
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
    const publicId = extractPublicId(category.image)
    if (publicId) deleteFromCloudinary(publicId).catch(() => {})
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
