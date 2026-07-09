import { ApiError } from '../utils/ApiError.js'

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message, details: err.details })
    return
  }

  // Multer / file upload specific errors
  if (err?.name === 'MulterError') {
    res.status(400).json({ success: false, message: `Upload error: ${err.message}` })
    return
  }

  console.error('[ERROR]', err)
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
  })
}
