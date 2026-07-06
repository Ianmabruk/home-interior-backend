import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendEmail, buildWelcomeEmailTemplate, buildLoginEmailTemplate } from '../config/sendgrid.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js'

const withId = (item) => ({ ...item, _id: item.id })
const withIdArray = (items) => items.map((item) => withId(item))

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
  const payload = { userId: user.id, role: user.role, email: user.email }
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }
}

export const register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body)
  const exists = await prisma.user.findFirst({ where: { email: body.email } })
  if (exists) {
    throw new ApiError(409, 'User already exists')
  }

  const passwordHash = await bcrypt.hash(body.password, 12)
  const { password: _password, ...userData } = body
  const user = await prisma.user.create({
    data: { ...userData, passwordHash },
  })

  const tokens = makeAuthResponse(user)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  })

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
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    ...tokens,
  })
})

export const login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body)
  const user = await prisma.user.findFirst({ where: { email: body.email } })
  if (!user) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const matches = await bcrypt.compare(body.password, user.passwordHash)
  if (!matches) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const tokens = makeAuthResponse(user)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  })

  try {
    await sendEmail({
      to: user.email,
      subject: 'HOK Interior - New Login Detected',
      html: buildLoginEmailTemplate({ fullName: user.fullName, email: user.email, timestamp: new Date().toISOString() }),
    })
  } catch (err) {
    console.error('Login email failed:', err)
  }

  res.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    ...tokens,
  })
})

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token required')
  }

  const decoded = verifyRefreshToken(refreshToken)
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Invalid refresh token')
  }

  const tokens = makeAuthResponse(user)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  })

  res.json(tokens)
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = z.string().email().parse(req.body.email)
  const user = await prisma.user.findFirst({ where: { email } })

  if (!user) {
    res.json({ message: 'If that account exists, a reset link has been sent.' })
    return
  }

  const token = crypto.randomBytes(32).toString('hex')
  const passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpires },
  })

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

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  })

  if (!user) {
    throw new ApiError(400, 'Reset link is invalid or expired')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null,
    },
  })

  res.json({ message: 'Password reset successful' })
})
