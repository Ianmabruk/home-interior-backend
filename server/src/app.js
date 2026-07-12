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
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { zodErrorHandler } from './middleware/zodErrorHandler.js'

export const app = express()

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

// Trust proxy so req.ip / rate limiter see the real client IP behind
// Render/Netlify/Cloudflare.
app.set('trust proxy', 1)

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
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for']
      if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',')
        return (ips[0] || '').trim() || req.ip || 'unknown'
      }
      return req.ip || 'unknown'
    },
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
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
    res.set('Vary', 'Accept-Encoding')
  }
  next()
}
app.use(cachePublic)

app.get(['/api/health', '/health'], async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', service: 'hok-interior-backend', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', service: 'hok-interior-backend', database: 'disconnected' })
  }
})

// Serve API routes under /api (canonical base URL used by VITE_API_URL).
// Do NOT mount at root — that leaks admin endpoints at multiple paths and
// breaks cache keys / rate-limiting assumptions.
app.use('/api', apiRoutes)

app.use(notFoundHandler)
app.use(zodErrorHandler)
app.use(errorHandler)
