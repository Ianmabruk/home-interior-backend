import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import crypto from 'crypto'
import apiRoutes from './routes/index.js'
import { env } from './config/env.js'
import { prisma, checkDatabaseHealth } from './config/db.js'
import { ApiError } from './utils/ApiError.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { zodErrorHandler } from './middleware/zodErrorHandler.js'
import { isMaintenanceMode, invalidateMaintenanceCache } from './utils/maintenance.js'

export const app = express()

// Trust the first proxy hop (Render/Netlify/Cloudflare) so req.ip and the
// rate limiter resolve the real client IP from X-Forwarded-For. Set FIRST,
// before any middleware reads req.ip, and kept a fixed hop count (1) rather
// than `true` so express-rate-limit's ERR_ERL_UNEXPECTED_X_FORWARDED_FOR /
// permissive-trust-proxy validations pass.
app.set('trust proxy', 1)

// Gzip/deflate all JSON + HTML responses. Small payloads matter most on
// mobile networks where the homepage feed + content APIs are fetched.
app.use(compression())

const isProd = env.nodeEnv === 'production'

const CLOUDINARY_DIRECTIVES = [
  "'self'",
  'https://res.cloudinary.com',
  'https://*.cloudinary.com',
]

const API_DIRECTIVES = [
  "'self'",
  env.clientUrl,
  'https://homy-comfy.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
]

// Build allowed origins list from env + known dev ports
const allowedOrigins = [
  env.clientUrl,
  // Production frontend (Netlify)
  'https://homy-comfy.netlify.app',
  // Local development origins
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
].filter(Boolean)

// Sanitize origin for CSP connect-src (strip path and port wildcards)
const sanitizeCspOrigin = (origin) => {
  if (!origin || origin === "'self'") return origin
  try {
    const url = new URL(origin)
    return `${url.protocol}//${url.hostname}`
  } catch {
    return origin
  }
}

const cspConnectSrc = [
  ...new Set(CLOUDINARY_DIRECTIVES.map(sanitizeCspOrigin)),
  ...new Set(API_DIRECTIVES.map(sanitizeCspOrigin)),
]

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc: CLOUDINARY_DIRECTIVES,
        styleSrc: [...CLOUDINARY_DIRECTIVES, "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', ...CLOUDINARY_DIRECTIVES],
        mediaSrc: CLOUDINARY_DIRECTIVES,
        connectSrc: cspConnectSrc,
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
)

// Additional hardened security headers not covered (or only conditionally
// applied) by helmet's defaults.
app.use((req, res, next) => {
  // X-XSS-Protection: legacy browser reflected-XSS mitigation.
  res.setHeader('X-XSS-Protection', '1; mode=block')
  // X-Frame-Options: explicit DENY (helmet frameguard already sets this,
  // but we assert it for redundancy/clarity).
  res.setHeader('X-Frame-Options', 'DENY')
  // HSTS: enforce HTTPS transport in production only.
  if (isProd) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    )
  }
  next()
})

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new ApiError(403, `CORS: origin ${origin} not allowed`), false)
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Ensure req.body is always an object. Prevents TypeError crashes on
// endpoints that receive empty POSTs (e.g. /auth/refresh with no payload).
app.use((req, res, next) => {
  if (req.body === undefined || req.body === null) {
    req.body = {}
  }
  next()
})

app.use(morgan('dev'))
app.use(
  '/api',
  rateLimit({
    windowMs: 1000 * 60,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    // trust proxy is set to 1 (above) so req.ip resolves the real client
    // from X-Forwarded-For. We disable XFF validation here so Render
    // requests without an X-Forwarded-For header do not crash the
    // server with ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. Per-client limiting
    // still works because req.ip is derived from trust proxy.
    validate: { xForwardedForHeader: false },
  }),
)

// Attach a unique request ID to every request for log correlation.
app.use((req, res, next) => {
  res.setHeader('X-Request-ID', crypto.randomUUID())
  next()
})

// Stricter rate limit for authentication endpoints to blunt brute-force /
// credential-stuffing attempts. Applied both under /api and at the root so
// it covers whichever base URL the frontend uses.
const authLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
})
app.use('/api/auth', authLimiter)
app.use('/auth', authLimiter)

// Cache public, read-only content + product listings at the edge/browser.
// Scoped strictly to anonymous GETs so user-specific or admin data is never
// cached or leaked. `stale-while-revalidate` keeps the UI instant on repeat
// visits while the backend revalidates in the background.
const cachePublic = (req, res, next) => {
  if (req.method !== 'GET') return next()
  const norm = req.path.replace(/^\/api/, '')
  const cacheable =
    norm.startsWith('/content/') ||
    (norm.startsWith('/products') && !norm.startsWith('/products/admin'))
  if (cacheable) {
    // Short TTL. Admin uploads must show on the public site within seconds, so
    // we no longer serve stale content for 5 minutes. The browser revalidates
    // every request (max-age=0); the CDN holds a 20s edge copy for perf. The
    // frontend service worker additionally uses NetworkFirst for these paths.
    res.set('Cache-Control', 'public, max-age=0, s-maxage=20, stale-while-revalidate=20')
    res.set('Vary', 'Accept-Encoding')
  }
  next()
}
app.use(cachePublic)

app.use(async (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') return next()
  if (req.method === 'OPTIONS') return next()
  try {
    const maintenance = await isMaintenanceMode(prisma)
    if (maintenance) {
      return res.status(503).json({ success: false, message: 'Site is under maintenance. Please check back later.' })
    }
  } catch {
    // ignore maintenance check errors to avoid taking down the site
  }
  next()
})

app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const health = await checkDatabaseHealth()
    res.json({
      database: health.database,
      prisma: health.prisma,
      server: 'running',
    })
  } catch {
    res.status(503).json({
      database: 'disconnected',
      prisma: 'disconnected',
      server: 'running',
    })
  }
})

// Serve API routes under /api (canonical base URL used by VITE_API_URL).
// Do NOT mount at root — that leaks admin endpoints at multiple paths and
// breaks cache keys / rate-limiting assumptions.
app.use('/api', apiRoutes)

app.use(notFoundHandler)
app.use(zodErrorHandler)
app.use(errorHandler)
