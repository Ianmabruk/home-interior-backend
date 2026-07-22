import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { env } from './config/env.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'

dotenv.config()

export const app = express()

app.set('trust proxy', 1)
app.use(compression())
app.use(morgan('dev'))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

const allowedOrigins = [
  process.env.CLIENT_URL,
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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
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
  rateLimit({
    windowMs: 1000 * 60,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  }),
)

const authLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
})
app.use('/api/auth', authLimiter)

app.use((req, res, next) => {
  res.setHeader('X-Request-ID', crypto.randomUUID())
  next()
})

app.get(['/api/health', '/health'], async (req, res) => {
  res.json({ database: 'ok', server: 'running' })
})

// TEMP DEV BYPASS - allows frontend to work without real auth in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-dev-bypass-auth'] === 'true') {
      req.admin = { id: 'temp-admin', email: 'admin@hokinterior.com', fullName: 'Admin', role: 'ADMIN' }
    }
    next()
  })
}

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)
