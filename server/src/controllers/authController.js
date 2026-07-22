import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { supabase } from '../config/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken, setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from '../utils/tokens.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { parseBody } from '../utils/helpers.js'

const withId = (item) => (item == null ? item : { ...item, _id: item.id })
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

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id')
    .eq('email', body.email)
    .single()

  if (existingError && existingError.code !== 'PGRST116') {
    throw new ApiError(500, existingError.message)
  }
  if (existing) {
    return res.status(409).json({ success: false, message: 'User already exists' })
  }

  const passwordHash = await bcrypt.hash(body.password, 12)
  const { password: _password, ...userData } = body

  const { data: user, error } = await supabase
    .from('users')
    .insert([{ ...userData, password_hash: passwordHash, role: 'user' }])
    .single()

  if (error) throw new ApiError(500, error.message)

  const tokens = makeAuthResponse(user)
  await supabase
    .from('users')
    .update({ refresh_token: tokens.refreshToken })
    .eq('id', user.id)

  setRefreshCookie(res, tokens.refreshToken)
  res.status(201).json(sendSuccess({
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
  }))
})

export const login = asyncHandler(async (req, res) => {
  const body = parseBody(loginSchema, req.body)

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', body.email)
    .single()

  if (userError || !user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' })
  }

  const matches = await bcrypt.compare(body.password, user.password_hash)
  if (!matches) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  const tokens = makeAuthResponse(user)
  await supabase
    .from('users')
    .update({ refresh_token: tokens.refreshToken, last_login_at: new Date().toISOString() })
    .eq('id', user.id)

  setRefreshCookie(res, tokens.refreshToken)
  res.json(sendSuccess({
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
  }))
})

export const refresh = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const refreshToken = body.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME]
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token missing' })
  }

  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
  }

  if (!decoded?.userId) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.userId)
    .single()

  if (userError || !user || user.refresh_token !== refreshToken || !user.is_active) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }

  const tokens = makeAuthResponse(user)
  await supabase
    .from('users')
    .update({ refresh_token: tokens.refreshToken })
    .eq('id', user.id)

  setRefreshCookie(res, tokens.refreshToken)
  res.json(sendSuccess({ accessToken: tokens.accessToken }))
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = parseBody(z.object({ email: z.string().email() }), req.body)
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user) {
    return res.json(sendSuccess({ message: 'If that account exists, a reset link has been sent.' }))
  }

  const token = crypto.randomBytes(32).toString('hex')
  const passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30).toISOString()

  await supabase
    .from('users')
    .update({ password_reset_token: token, password_reset_expires: passwordResetExpires })
    .eq('id', user.id)

  res.json(sendSuccess({ message: 'If that account exists, a reset link has been sent.' }))
})

export const resetPassword = asyncHandler(async (req, res) => {
  const token = req.params.token
  const { password } = parseBody(z.object({ password: z.string().min(8) }), req.body)

  if (!token || token.length < 10) {
    throw new ApiError(400, 'Invalid reset token')
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('password_reset_token', token)
    .lt('password_reset_expires', new Date().toISOString())
    .single()

  if (error || !user) {
    throw new ApiError(400, 'Reset link is invalid or expired')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await supabase
    .from('users')
    .update({ password_hash: passwordHash, password_reset_token: null, password_reset_expires: null, refresh_token: null })
    .eq('id', user.id)

  clearRefreshCookie(res)
  res.json(sendSuccess({ message: 'Password reset successful' }))
})

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]
  if (refreshToken) {
    try {
      verifyRefreshToken(refreshToken)
      await supabase
        .from('users')
        .update({ refresh_token: null })
        .eq('id', req.user.userId)
    } catch {
      // ignore invalid token
    }
  }
  clearRefreshCookie(res)
  res.json(sendSuccess({ message: 'Logged out' }))
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
})

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = parseBody(changePasswordSchema, req.body)

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.userId)
    .single()

  if (userError || !user) {
    throw new ApiError(404, 'User not found')
  }

  const matches = await bcrypt.compare(currentPassword, user.password_hash)
  if (!matches) {
    throw new ApiError(401, 'Current password is incorrect')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', user.id)

  res.json(sendSuccess({ message: 'Password changed successfully. Please log in again.' }))
})

export const authController = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
}
