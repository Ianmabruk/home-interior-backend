import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendEmail, buildWelcomeEmailTemplate, buildLoginEmailTemplate } from '../config/sendgrid.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken, setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from '../utils/tokens.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

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
  const body = parseBody(registerSchema, req.body)
  const exists = await prisma.user.findUnique({ where: { email: body.email } })
  if (exists) {
    console.warn(`[AUTH][register] rejected: user already exists ${body.email}`)
    throw new ApiError(409, 'User already exists')
  }

  const passwordHash = await bcrypt.hash(body.password, 12)
  const { password: _password, ...userData } = body
  const user = await prismaSafeWrite(
    (writeData) => prisma.user.create({
      data: { ...writeData, passwordHash },
    }),
    userData,
    'AUTH][REGISTER',
  )

  const tokens = makeAuthResponse(user)
  await prismaSafeWrite(
    (writeData) => prisma.user.update({
      where: { id: user.id },
      data: writeData,
    }),
    { refreshToken: tokens.refreshToken },
    'AUTH][REGISTER',
  )

  try {
    await sendEmail({
      to: body.email,
      subject: 'Welcome to HOK Interior Designs',
      html: buildWelcomeEmailTemplate({ fullName: body.fullName, email: body.email }),
    })
  } catch (err) {
    console.error('[AUTH][register] welcome email failed:', err)
  }

  setRefreshCookie(res, tokens.refreshToken)
  console.info(`[AUTH][register] success: userId=${user.id} email=${user.email}`)

  res.status(201).json(sendSuccess({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
  }))
})

export const login = asyncHandler(async (req, res) => {
  const body = parseBody(loginSchema, req.body)
  const user = await prisma.user.findUnique({ where: { email: body.email } })
  if (!user) {
    console.warn(`[AUTH][login] rejected: invalid credentials for ${body.email}`)
    throw new ApiError(401, 'Invalid credentials')
  }

  if (!user.isActive) {
    console.warn(`[AUTH][login] rejected: inactive account for ${body.email}`)
    throw new ApiError(403, 'Your account has been suspended. Contact support.')
  }

  const matches = await bcrypt.compare(body.password, user.passwordHash)
  if (!matches) {
    console.warn(`[AUTH][login] rejected: invalid credentials for ${body.email}`)
    throw new ApiError(401, 'Invalid credentials')
  }

  const tokens = makeAuthResponse(user)
  await prismaSafeWrite(
    (writeData) => prisma.user.update({
      where: { id: user.id },
      data: writeData,
    }),
    { refreshToken: tokens.refreshToken },
    'AUTH][LOGIN',
  )

  try {
    await sendEmail({
      to: user.email,
      subject: 'HOK Interior - New Login Detected',
      html: buildLoginEmailTemplate({ fullName: user.fullName, email: user.email, timestamp: new Date().toISOString() }),
    })
  } catch (err) {
    console.error('[AUTH][login] notification email failed:', err)
  }

  setRefreshCookie(res, tokens.refreshToken)
  console.info(`[AUTH][login] success: userId=${user.id} email=${user.email} role=${user.role}`)

  res.json(sendSuccess({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
  }))
})

export const refresh = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || body.refreshToken
  if (!refreshToken) {
    console.warn('[AUTH][refresh] rejected: no refresh token in cookie or body')
    throw new ApiError(400, 'Refresh token required')
  }

  // Verify the JWT signature/expiry. Any failure is a clean 401 (never 500),
  // so a bad/expired token can't crash the endpoint or trigger a retry loop.
  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch (err) {
    console.warn('[AUTH][refresh] rejected: invalid/expired token —', err?.message)
    throw new ApiError(401, 'Invalid or expired refresh token')
  }

  if (!decoded?.userId) {
    console.warn('[AUTH][refresh] rejected: token missing userId claim')
    throw new ApiError(401, 'Invalid refresh token')
  }

  // DB failures are caught and downgraded to 401: a 500 here would make the
  // client treat it as a server fault and retry the refresh, looping.
  let user
  try {
    user = await prisma.user.findUnique({ where: { id: decoded.userId } })
  } catch (err) {
    console.error('[AUTH][refresh] DB error looking up user:', err)
    throw new ApiError(401, 'Invalid refresh token')
  }

  if (!user || user.refreshToken !== refreshToken || !user.isActive) {
    console.warn('[AUTH][refresh] rejected: user not found, token mismatch, or inactive (userId=%s)', decoded.userId)
    throw new ApiError(401, 'Invalid refresh token')
  }

  const tokens = makeAuthResponse(user)
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    })
  } catch (err) {
    console.error('[AUTH][refresh] DB error rotating refresh token:', err)
    throw new ApiError(401, 'Invalid refresh token')
  }

  setRefreshCookie(res, tokens.refreshToken)
  console.info('[AUTH][refresh] success (userId=%s)', user.id)
  res.json(sendSuccess({ accessToken: tokens.accessToken }))
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = parseBody(z.object({ email: z.string().email() }), req.body)
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.json(sendSuccess({ message: 'If that account exists, a reset link has been sent.' }))
    return
  }

  const token = crypto.randomBytes(32).toString('hex')
  const passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30)

  await prismaSafeWrite(
    (writeData) => prisma.user.update({
      where: { id: user.id },
      data: writeData,
    }),
    { passwordResetToken: token, passwordResetExpires },
    'AUTH][FORGOT',
  )

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`
  await sendEmail({
    to: email,
    subject: 'Reset your HOK Interior password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
  })

  res.json(sendSuccess({ message: 'If that account exists, a reset link has been sent.' }))
})

export const resetPassword = asyncHandler(async (req, res) => {
  const token = req.params.token
  const { password } = parseBody(z.object({ password: z.string().min(8) }), req.body)

  if (!token || token.length < 10) {
    throw new ApiError(400, 'Invalid reset token')
  }

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
  await prismaSafeWrite(
    (writeData) => prisma.user.update({
      where: { id: user.id },
      data: writeData,
    }),
    {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null,
    },
    'AUTH][RESET',
  )

  clearRefreshCookie(res)
  res.json(sendSuccess({ message: 'Password reset successful' }))
})

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken)
      await prismaSafeWrite(
        () => prisma.user.update({
          where: { id: decoded.userId },
          data: { refreshToken: null },
        }),
        { refreshToken: null },
        'AUTH][LOGOUT',
      )
      console.info(`[AUTH][logout] success: userId=${decoded.userId}`)
    } catch {
      console.warn('[AUTH][logout] invalid refresh token in cookie')
    }
  }
  clearRefreshCookie(res)
  res.json(sendSuccess({ message: 'Logged out' }))
})
