import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'
import { createRateLimiter } from './middleware/redisRateLimiter.js'
import { getRedisClient, isRedisAvailable } from './config/redis.js'
import { buildVersionMiddleware } from './middleware/buildVersion.js'

dotenv.config()

export const app = express()

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'

// Request timeout: abort requests that take longer than 30 seconds.
// This prevents a single slow query from hanging the server indefinitely.
const REQUEST_TIMEOUT_MS = 30000

app.set('trust proxy', 1)
app.use(compression())
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
)
app.use(helmet.frameguard({ action: 'deny' }))
app.use(helmet.noSniff())
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }))
app.use(helmet.permittedCrossDomainPolicies({ permittedPolicies: 'none' }))
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
       imgSrc: ["'self'", 'data:', 'https:'],
       mediaSrc: ["'self'", 'https://res.cloudinary.com'],
       objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      upgradeInsecureRequests: [],
    },
  }),
)
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }))
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
// Request logging is skipped in production to avoid per-request stdout I/O
// overhead (log shipping on platforms like Render). In development it gives
// useful request traces without affecting production throughput.
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan((tokens, req, res) => {
    return [
      `[${SERVER_ID}]`,
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'),
      '-',
      tokens['response-time'](req, res),
      'ms'
    ].join(' ')
  }))
}
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

// Request timeout middleware: abort requests that exceed the timeout.
// This ensures that slow queries or external API calls don't hang the server.
app.use((req, res, next) => {
  // Allow longer timeouts for requests that might involve file uploads or external API calls
  const isUpload = req.path.includes('/upload') || req.path.includes('/media') || req.path.includes('/circular-tabs') || req.path.includes('/shop') || req.path.includes('/orders') || req.path.includes('/portfolio') || req.path.includes('/virtual-design') || req.path.includes('/blog')
  const timeout = isUpload ? 120000 : REQUEST_TIMEOUT_MS
  res.setTimeout(timeout, () => {
    console.error(`[${SERVER_ID}] [timeout] ${req.method} ${req.originalUrl} exceeded ${timeout}ms`)
    if (!res.headersSent) {
      res.status(408).json({ success: false, message: 'Request timeout' })
    }
  })
  next()
})

// CLIENT_URL may list several origins, comma or space separated, so a deploy
// can serve a custom domain plus the Netlify-generated one at the same time.
// A single value still works exactly as before.
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(/[,\s]+/)
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

const allowedOrigins = [
  ...configuredOrigins,
  'https://hokinteriors.com',
  'https://www.hokinteriors.com',
  'https://hokinteriors.co.ke',
  'https://www.hokinteriors.co.ke',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
].filter(Boolean)

const isAllowedOrigin = (origin) => {
  // Same-document requests (curl, server-to-server, health checks) send no
  // Origin and are not subject to CORS.
  if (!origin) return true
  if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return true
  return false
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true)
      return callback(new Error(`CORS: origin ${origin} not allowed`), false)
    },
    credentials: true,
  }),
)

app.use((req, res, next) => {
  if (req.body === undefined || req.body === null) req.body = {}
  next()
})

app.use(
  '/api',
  createRateLimiter({
    windowMs: 1000 * 60,
    limit: 120,
    keyPrefix: 'rl:api',
  }),
)

const authLimiter = createRateLimiter({
  windowMs: 1000 * 60 * 15,
  limit: 20,
  keyPrefix: 'rl:auth',
})
app.use('/api/auth', authLimiter)

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('X-Server-ID', process.env.SERVER_ID || 'hok-api-01')
  }
  next()
})

app.use((req, res, next) => {
  res.setHeader('X-Request-ID', crypto.randomUUID())
  next()
})

import { prisma } from './config/database.js'

app.get(['/api/health', '/health'], async (req, res) => {
  let database = 'error'
  try {
    await prisma.$queryRaw`SELECT 1`
    database = 'ok'
  } catch (err) {
    console.error(`[${SERVER_ID}] [health] database check failed:`, err?.message || err)
  }
  res.json({ database, server: 'running' })
})

app.get(['/api/ready', '/ready'], async (req, res) => {
  let database = 'error'
  let cache = 'not-configured'
  try {
    await prisma.$queryRaw`SELECT 1`
    database = 'ok'
  } catch (err) {
    console.error(`[${SERVER_ID}] [ready] database check failed:`, err?.message || err)
  }
  try {
    if (process.env.REDIS_URL) {
      const client = await getRedisClient()
      if (client && isRedisAvailable()) {
        await client.ping()
        cache = 'ok'
      } else {
        cache = 'error'
      }
    }
  } catch (err) {
    cache = 'error'
    console.error(`[${SERVER_ID}] [ready] cache check failed:`, err?.message || err)
  }
  const ready = database === 'ok' && (cache === 'ok' || cache === 'not-configured')
  res.status(ready ? 200 : 503).json({ database, cache, server: 'running', ready })
})

app.use('/uploads', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'uploads')))

app.use(buildVersionMiddleware)
app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)
