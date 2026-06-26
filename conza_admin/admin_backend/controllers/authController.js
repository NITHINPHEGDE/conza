const crypto = require('crypto')
const Admin = require('../models/Admin')
const LoginHistory = require('../models/LoginHistory')
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/jwt')
const { sendPasswordResetEmail } = require('../utils/email')
const { sendSuccess, sendError } = require('../utils/response')
const { createError } = require('../utils/error')

const getDeviceInfo = (userAgent) => {
  if (!userAgent) return 'Unknown'
  let browser = 'Unknown'
  let os = 'Unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'
  return `${browser} / ${os}`
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(createError(400, 'Email and password are required.'))
    }

    const admin = await Admin.findOne({ email }).select('+password +permissions')

    const ip = req.ip || req.connection.remoteAddress || ''
    const device = getDeviceInfo(req.headers['user-agent'])

    if (!admin || !(await admin.comparePassword(password))) {
      await LoginHistory.create({
        adminId: admin ? admin._id : null,
        user: admin ? admin.name : 'Unknown',
        email: admin ? admin.email : email,
        role: admin ? admin.role : '-',
        ip,
        device,
        location: 'Unknown',
        status: 'failed',
        failureReason: !admin ? 'Admin not found' : 'Invalid password',
      })
      return next(createError(401, 'Invalid email or password.'))
    }

    if (admin.status !== 'active') {
      return next(createError(403, 'Your account has been suspended or deactivated. Contact super admin.'))
    }

    await LoginHistory.create({
      adminId: admin._id,
      user: admin.name,
      email: admin.email,
      role: admin.role,
      ip,
      device,
      location: 'Unknown',
      status: 'success',
    })

    admin.lastLogin = new Date()
    await admin.save({ validateBeforeSave: false })

    const token = generateToken(admin._id, admin.role)
    setTokenCookie(res, token)

    sendSuccess(res, 200, 'Login successful', {
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        permissions: admin.permissions,
      },
    })
  } catch (err) {
    next(err)
  }
}

exports.logout = async (req, res, next) => {
  try {
    clearTokenCookie(res)
    sendSuccess(res, 200, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
}

exports.getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('+permissions')
    if (!admin) return next(createError(404, 'Admin not found.'))

    sendSuccess(res, 200, 'Admin fetched', {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      },
    })
  } catch (err) {
    next(err)
  }
}

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return next(createError(400, 'Email is required.'))

    const admin = await Admin.findOne({ email })
    if (!admin) {
      // Don't reveal whether admin exists
      return sendSuccess(res, 200, 'If that email exists, a reset link has been sent.')
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    admin.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    admin.passwordResetExpires = Date.now() + 60 * 60 * 1000 // 1 hour
    await admin.save({ validateBeforeSave: false })

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    await sendPasswordResetEmail(admin.email, admin.name, resetUrl)

    sendSuccess(res, 200, 'If that email exists, a reset link has been sent.')
  } catch (err) {
    next(err)
  }
}

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return next(createError(400, 'Token and new password are required.'))
    }

    if (password.length < 8) {
      return next(createError(400, 'Password must be at least 8 characters.'))
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const admin = await Admin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires')

    if (!admin) {
      return next(createError(400, 'Reset token is invalid or has expired.'))
    }

    admin.password = password
    admin.passwordResetToken = undefined
    admin.passwordResetExpires = undefined
    await admin.save()

    sendSuccess(res, 200, 'Password reset successful. You can now login.')
  } catch (err) {
    next(err)
  }
}
