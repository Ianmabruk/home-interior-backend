import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendEmail, buildWelcomeEmailTemplate, buildLoginEmailTemplate } from '../config/sendgrid.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js'

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const makeAuthResponse = (user) => {
  const payload = { userId: user._id.toString(), role: user.role, email: user.email }
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }
}

export const register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body)
  const exists = await User.findOne({ email: body.email })
  if (exists) {
    throw new ApiError(409, 'User already exists')
  }

  const passwordHash = await bcrypt.hash(body.password, 12)
  const user = await User.create({ ...body, passwordHash })

  const tokens = makeAuthResponse(user)
  user.refreshToken = tokens.refreshToken
  await user.save()

  // Send welcome email
  try {
    await sendEmail({
      to: body.email,
      subject: 'Welcome to HOK Interior Designs',
      html: buildWelcomeEmailTemplate({ fullName: body.fullName, email: body.email }),
    })
  } catch (err) {
    console.error('Welcome email failed:', err)
  }

  res.status(201).json({
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    ...tokens,
  })
})

export const login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body)
  const user = await User.findOne({ email: body.email })
  if (!user) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const matches = await bcrypt.compare(body.password, user.passwordHash)
  if (!matches) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const tokens = makeAuthResponse(user)
  user.refreshToken = tokens.refreshToken
  await user.save()

  // Send login alert email
  try {
    await sendEmail({
      to: body.email,
      subject: 'HOK Interior - New Login Detected',
      html: buildLoginEmailTemplate({ fullName: user.fullName, email: body.email, timestamp: new Date().toISOString() }),
    })
  } catch (err) {
    console.error('Login email failed:', err)
  }

  res.json({
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    ...tokens,
  })
})

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token required')
  }

  const decoded = verifyRefreshToken(refreshToken)
  const user = await User.findById(decoded.userId)
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Invalid refresh token')
  }

  const tokens = makeAuthResponse(user)
  user.refreshToken = tokens.refreshToken
  await user.save()

  res.json(tokens)
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = z.string().email().parse(req.body.email)
  const user = await User.findOne({ email })

  if (!user) {
    res.json({ message: 'If that account exists, a reset link has been sent.' })
    return
  }

  const token = crypto.randomBytes(32).toString('hex')
  user.passwordResetToken = token
  user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30)
  await user.save()

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`
  await sendEmail({
    to: email,
    subject: 'Reset your HOK Interior password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
  })

  res.json({ message: 'If that account exists, a reset link has been sent.' })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const token = z.string().min(10).parse(req.params.token)
  const password = z.string().min(8).parse(req.body.password)

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  })

  if (!user) {
    throw new ApiError(400, 'Reset link is invalid or expired')
  }

  user.passwordHash = await bcrypt.hash(password, 12)
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  user.refreshToken = undefined
  await user.save()

  res.json({ message: 'Password reset successful' })
})