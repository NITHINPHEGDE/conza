const nodemailer = require('nodemailer')

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter()
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Conza Admin'}" <${process.env.FROM_EMAIL || 'noreply@conza.in'}>`,
      to,
      subject,
      html,
      text,
    })
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error('Email send error:', err.message)
    return { success: false, error: err.message }
  }
}

const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F59E0B;">Conza Admin - Password Reset</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset for your admin account. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Reset Password
      </a>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      <p>— Conza Admin Team</p>
    </div>
  `
  return sendEmail({ to: email, subject: 'Conza Admin - Password Reset Request', html })
}

module.exports = { sendEmail, sendPasswordResetEmail }
