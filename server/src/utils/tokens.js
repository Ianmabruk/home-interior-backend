import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const REFRESH_COOKIE_NAME = 'hok_refresh'
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

const parseTtlToMs = (ttl) => {
  if (!ttl || typeof ttl !== 'string') return ONE_WEEK_MS
  const m = ttl.match(/^(\d+)([smhd])$/)
  if (!m) return ONE_WEEK_MS
  const n = Number(m[1])
  const unit = m[2]
  if (unit === 's') return n * 1000
  if (unit === 'm') return n * 60 * 1000
  if (unit === 'h') return n * 60 * 60 * 1000
  if (unit === 'd') return n * 24 * 60 * 60 * 1000
  return ONE_WEEK_MS
}

// httpOnly + SameSite=strict + Secure(in prod) cookie carrying the refresh
// token. Keeping it out of localStorage makes it unreadable by any XSS payload,
// so a script injected on the page cannot steal the long-lived session.
export const refreshCookieOptions = () => {
  const isProd = env.nodeEnv === 'production'
  const maxAge = parseTtlToMs(env.refreshTokenTtl)
  return {
    httpOnly: true,
    // Production frontend (Netlify) and API (Render) are cross-site, so the
    // refresh cookie must be SameSite=None + Secure to be sent on those
    // cross-origin requests. In dev the API is reached same-origin via the
    // Vite proxy over http, so a non-Secure Lax cookie is used instead.
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge,
  }
}

export const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions())
}

export const clearRefreshCookie = (res) => {
  const isProd = env.nodeEnv === 'production'
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  })
}

export const signAccessToken = (payload) => jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl })

export const signRefreshToken = (payload) => jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl })

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret)

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret)
