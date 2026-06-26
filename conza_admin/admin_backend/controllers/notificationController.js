const Notification = require('../models/Notification')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { createError } = require('../utils/error')

exports.sendPush = async (req, res, next) => {
  try {
    const { title, message, target = 'all', targetIds = [] } = req.body
    if (!message) return next(createError(400, 'Message is required.'))

    const notification = await Notification.create({
      type: 'push',
      title,
      message,
      target,
      targetIds,
      status: 'sent',
      sentBy: req.admin.name,
      sentByAdminId: req.admin._id,
      sentCount: targetIds.length || 100,
    })

    req.auditTarget = `Notification #${notification._id}`
    req.auditDetails = `Push notification sent to ${target}`

    sendSuccess(res, 201, 'Push notification sent', { notification })
  } catch (err) {
    next(err)
  }
}

exports.sendSMS = async (req, res, next) => {
  try {
    const { message, target = 'all', targetIds = [] } = req.body
    if (!message) return next(createError(400, 'Message is required.'))

    const notification = await Notification.create({
      type: 'sms',
      message,
      target,
      targetIds,
      status: 'sent',
      sentBy: req.admin.name,
      sentByAdminId: req.admin._id,
      sentCount: targetIds.length || 100,
    })

    sendSuccess(res, 201, 'SMS notification sent', { notification })
  } catch (err) {
    next(err)
  }
}

exports.sendEmail = async (req, res, next) => {
  try {
    const { title, message, target = 'all', targetIds = [] } = req.body
    if (!message || !title) return next(createError(400, 'Title and message are required.'))

    const notification = await Notification.create({
      type: 'email',
      title,
      message,
      target,
      targetIds,
      status: 'sent',
      sentBy: req.admin.name,
      sentByAdminId: req.admin._id,
      sentCount: targetIds.length || 100,
    })

    sendSuccess(res, 201, 'Email notification sent', { notification })
  } catch (err) {
    next(err)
  }
}

exports.getHistory = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query
    const query = {}
    if (type && type !== 'all') query.type = type

    const total = await Notification.countDocuments(query)
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
    sendPaginated(res, notifications, total, page, limit)
  } catch (err) {
    next(err)
  }
}
