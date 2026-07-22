import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'
import { env } from '../config/env.js'

export const authService = {
  login,
  refresh,
  logout,
  me,
}

async function login(email, password) {
  const admin = await prisma.admin.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, fullName: true, role: true },
  })

  if (!admin) {
    throw failure(401, 'Invalid email or password')
  }

  const valid = await bcrypt.compare(password, admin.passwordHash)
  if (!valid) {
    throw failure(401, 'Invalid email or password')
  }

  const payload = { adminId: admin.id, email: admin.email, role: admin.role }
  const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl || '15m' })
  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl || '30d' })

  await prisma.passwordReset.deleteMany({ where: { adminId: admin.id } }).catch(() => {})
  await prisma.passwordReset.create({
    data: {
      adminId: admin.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  return {
    user: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
    accessToken,
    refreshToken,
  }
}

async function refresh(refreshToken) {
  if (!refreshToken) throw failure(401, 'No refresh token')

  let decoded
  try {
    decoded = jwt.verify(refreshToken, env.jwtRefreshSecret)
  } catch {
    throw failure(401, 'Invalid refresh token')
  }

  const reset = await prisma.passwordReset.findFirst({
    where: { adminId: decoded.adminId, token: refreshToken },
  })

  if (!reset || new Date(reset.expiresAt) < new Date()) {
    throw failure(401, 'Invalid refresh token')
  }

  const admin = await prisma.admin.findUnique({
    where: { id: decoded.adminId },
    select: { id: true, email: true, fullName: true, role: true },
  })

  if (!admin) throw failure(401, 'Admin not found')

  const payload = { adminId: admin.id, email: admin.email, role: admin.role }
  const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl || '15m' })
  const newRefresh = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl || '30d' })

  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { token: newRefresh, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  })

  return { accessToken, refreshToken: newRefresh }
}

async function logout(refreshToken) {
  if (!refreshToken) return
  await prisma.passwordReset.deleteMany({ where: { token: refreshToken } }).catch(() => {})
}

async function me(adminId) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  })
  if (!admin) throw failure(404, 'Admin not found')
  return admin
}
