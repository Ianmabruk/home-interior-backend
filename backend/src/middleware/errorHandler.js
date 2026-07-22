import { ApiError } from '../utils/ApiError.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` })
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500
  const message = err.message || 'Internal server error'
  console.error(`[${req.method} ${req.originalUrl}]`, err)
  res.status(status).json({ success: false, message })
}
