const express = require('express')
const router = express.Router()
const c = require('../controllers/notificationController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('notifications'))

router.post('/push', logAction('Notifications', 'Push Sent', 'content', 'low'), c.sendPush)
router.post('/sms', logAction('Notifications', 'SMS Sent', 'content', 'low'), c.sendSMS)
router.post('/email', logAction('Notifications', 'Email Sent', 'content', 'low'), c.sendEmail)
router.get('/history', c.getHistory)

module.exports = router
