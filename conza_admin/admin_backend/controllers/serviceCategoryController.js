const ServiceCategory = require('../models/ServiceCategory')
const Worker = require('../models/Worker')
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
    const { name, image, commission, radius, description, baseCharge, perHourCharge, perDayCharge } = req.body
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
      baseCharge:    baseCharge    != null ? Number(baseCharge)    : 0,
      perHourCharge: perHourCharge != null ? Number(perHourCharge) : 0,
      perDayCharge:  perDayCharge  != null ? Number(perDayCharge)  : 0,
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

    if (updates.baseCharge    !== undefined) updates.baseCharge    = Number(updates.baseCharge)    || 0
    if (updates.perHourCharge !== undefined) updates.perHourCharge = Number(updates.perHourCharge) || 0
    if (updates.perDayCharge  !== undefined) updates.perDayCharge  = Number(updates.perDayCharge)  || 0

    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })

    // Pricing is category-wide: whenever the admin edits pricing for a
    // category, push the new charges onto every worker already registered
    // under that category so pricing stays consistent.
    if (updates.baseCharge !== undefined || updates.perHourCharge !== undefined || updates.perDayCharge !== undefined) {
      await Worker.updateMany(
        { category: category.name },
        {
          $set: {
            baseCharge:  category.baseCharge,
            minCharge:   category.perHourCharge,
            perDayCharge: category.perDayCharge,
          },
        }
      )
    }

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