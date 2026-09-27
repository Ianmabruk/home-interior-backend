import { ApiError } from '../utils/ApiError.js'

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'
// Must match MAX_FILE_SIZE in middleware/upload.js (50MB)
const MAX_UPLOAD_SIZE_MB = 50

export function notFoundHandler(req, res) {
  res.setHeader('X-Server-ID', SERVER_ID)
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` })
}

export function errorHandler(err, req, res, next) {
  if (err?.message?.includes('CORS: origin')) {
    res.setHeader('X-Server-ID', SERVER_ID)
    return res.status(403).json({ success: false, message: 'Not allowed by CORS' })
  }

  if (err?.code === 'LIMIT_FILE_SIZE' || err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_FIELD_COUNT') {
    res.setHeader('X-Server-ID', SERVER_ID)
    const message = err?.code === 'LIMIT_FILE_SIZE'
      ? `Uploaded file is too large. Maximum allowed size is ${MAX_UPLOAD_SIZE_MB}MB.`
      : 'Uploaded file is too large'
    return res.status(413).json({ success: false, message })
  }

  if (err?.name === 'MulterError' && err?.code === 'LIMIT_UNEXPECTED_FILE') {
    res.setHeader('X-Server-ID', SERVER_ID)
    return res.status(400).json({ success: false, message: `Too many files uploaded for field '${err?.field || 'unknown'}'. Maximum limit exceeded.` })
  }

  if (err?.code === 'P2002') {
    res.setHeader('X-Server-ID', SERVER_ID)
    return res.status(409).json({ success: false, message: 'Duplicate value violates a unique constraint' })
  }

  if (err?.code === 'P2025') {
    res.setHeader('X-Server-ID', SERVER_ID)
    return res.status(404).json({ success: false, message: 'Record not found' })
  }

  // Infrastructure/connectivity failures (DB asleep, cold start, network blip).
  // Answer with a generic, actionable message and never the raw Prisma code.
  if (err?.code === 'P1001' || err?.code === 'P1002' || err?.code === 'P1008' || err?.code === 'P1009' || err?.code === 'P2024') {
    res.setHeader('X-Server-ID', SERVER_ID)
    console.error(`[${SERVER_ID}] [${req.method} ${req.originalUrl}] database unavailable:`, err?.message)
    return res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again.' })
  }

  const isOperational = err instanceof ApiError

  const status = isOperational
    ? err.status
    : (err?.status && err.status >= 400 && err.status < 500 ? err.status : 500)

  const inProduction = process.env.NODE_ENV === 'production'
  const message = inProduction && status >= 500
    ? 'Internal server error'
    : (isOperational ? err.message : (err?.message || 'Internal server error'))

  console.error(`[${SERVER_ID}] [${req.method} ${req.originalUrl}]`, {
    status,
    message: err?.message,
    stack: inProduction ? undefined : err?.stack,
  })

  res.setHeader('X-Server-ID', SERVER_ID)
  const body = { success: false, message }
  // Only surface metadata on client errors we authored. Library errors (Prisma
  // P####, driver codes) can carry connection strings, hostnames and query text,
  // so their code/details are logged server-side and never serialised.
  // Our own codes are SCREAMING_SNAKE_CASE, e.g. TOTAL_IMAGE_LIMIT_EXCEEDED.
  const isAppCode = typeof err?.code === 'string' && /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(err.code)
  if (status < 500) {
    if (isAppCode) body.code = err.code
    if (err?.details) body.details = err.details
  }
  res.status(status).json(body)
}
