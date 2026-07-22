import { asyncHandler } from '../middleware/asyncHandler.js'
import { failure } from '../utils/response.js'
import { authService } from '../services/authService.js'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/database.js'

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }
    const result = await authService.login(email, password)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    res.json({ success: true, data: { user: result.user, accessToken: result.accessToken } })
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.headers['x-refresh-token']
    const result = await authService.refresh(token)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    res.json({ success: true, data: { accessToken: result.accessToken } })
  }),

  logout: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.headers['x-refresh-token']
    await authService.logout(token)
    res.clearCookie('refreshToken', { path: '/' })
    res.json({ success: true, data: { message: 'Logged out successfully' } })
  }),

  me: asyncHandler(async (req, res) => {
    const admin = await authService.me(req.admin.id)
    res.json({ success: true, data: admin })
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { fullName } = req.body
    const updated = await prisma.admin.update({
      where: { id: req.admin.id },
      data: { fullName: fullName || req.admin.fullName },
      select: { id: true, email: true, fullName: true, role: true },
    })
    res.json({ success: true, data: updated })
  }),
}
