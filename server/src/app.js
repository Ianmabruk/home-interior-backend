import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import apiRoutes from './routes/index.js'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

export const app = express()

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

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      // Allow any Netlify/Vercel/Render preview URL for this project
      if (/\.netlify\.app$/.test(origin) || /\.vercel\.app$/.test(origin) || /\.onrender\.com$/.test(origin)) {
        return callback(null, true)
      }
      callback(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(
  '/api',
  rateLimit({
    windowMs: 1000 * 60,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'hok-interior-backend' })
})

// Serve API routes both under /api (canonical, used by local dev proxy and
// VITE_API_URL values that include /api) and at the root. This keeps the
// frontend working regardless of whether its base URL ends with "/api",
// e.g. both https://<backend>.onrender.com/api/auth/login and
// https://<backend>.onrender.com/auth/login resolve correctly.
app.use('/api', apiRoutes)
app.use('/', apiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)
