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
import { supabase } from './config/supabase.js'
import { ApiError } from './utils/ApiError.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { zodErrorHandler } from './middleware/zodErrorHandler.js'
import { isMaintenanceMode, invalidateMaintenanceCache } from './utils/maintenance.js'

export const app = express()

app.set('trust proxy', 1)

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

const allowedOrigins = [
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
].filter(Boolean)

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

app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('X-Frame-Options', 'DENY')
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
    validate: { xForwardedForHeader: false },
  }),
)

app.use((req, res, next) => {
  res.setHeader('X-Request-ID', crypto.randomUUID())
  next()
})

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

const cachePublic = (req, res, next) => {
  if (req.method !== 'GET') return next()
  const norm = req.path.replace(/^\/api/, '')
  const cacheable =
    norm.startsWith('/content/') ||
    (norm.startsWith('/products') && !norm.startsWith('/products/admin'))
  if (cacheable) {
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
    const maintenance = await isMaintenanceMode()
    if (maintenance) {
      return res.status(503).json({ success: false, message: 'Site is under maintenance. Please check back later.' })
    }
  } catch {
    // ignore maintenance check errors to avoid taking down the site
  }
  next()
})

app.get(['/api/health', '/health'], async (req, res) => {
  let dbStatus = 'unknown'
  try {
    const { error } = await supabase.from('settings').select('id').limit(1)
    dbStatus = error ? 'error' : 'connected'
  } catch {
    dbStatus = 'error'
  }

  res.json({
    database: dbStatus,
    supabase: dbStatus,
    server: 'running',
  })
})

// TEMP AUTH BYPASS - REMOVE BEFORE PRODUCTION
app.use((req, res, next) => {
  req.user = { id: 'temp-admin', role: 'ADMIN', email: 'admin@hokinterior.com' }
  next()
})

app.use('/api', apiRoutes)

app.use(notFoundHandler)
app.use(zodErrorHandler)
app.use(errorHandler)
