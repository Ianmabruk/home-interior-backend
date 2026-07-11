import { ApiError } from '../utils/ApiError.js'

export const validateBody = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {
    return next(new ApiError(400, 'Validation failed', parsed.error.flatten()))
  }

  req.body = parsed.data
  next()
}

// ---------- Manual input sanitization (no external dependencies) ----------

// Matches any HTML/XML tag. We *remove* tags rather than escape characters:
// escaping `/` and `&` (the old behaviour) corrupted legitimate data such as
// URLs stored in `socials`, `contactEmail`, and link fields. The client renders
// all content through React, which auto-escapes on output, so stripping the
// tags here is sufficient defense-in-depth against stored XSS.
const HTML_TAG_RE = /<\/?[^>]+(>|$)/g

const sanitizeString = (value) => {
  if (typeof value !== 'string') return value
  return value.replace(HTML_TAG_RE, '').trim()
}

const sanitizeValue = (value) => {
  if (typeof value === 'string') return sanitizeString(value)
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value && typeof value === 'object') return sanitizeObject(value)
  return value
}

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  const result = Array.isArray(obj) ? [] : {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sanitizeValue(value)
  }
  return result
}

// Recursively strip HTML tags and escape special characters from
// req.body, req.query and req.params. For multipart requests multer
// only stores text fields in req.body (file buffers live in req.file/
// req.files), so sanitizing req.body is safe.
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  if (req.query && typeof req.query === 'object') {
    Object.assign(req.query, sanitizeObject(req.query))
  }
  if (req.params && typeof req.params === 'object') {
    Object.assign(req.params, sanitizeObject(req.params))
  }
  next()
}

// ---------- File upload validation ----------

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const DEFAULT_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

// Returns a middleware that validates an uploaded file produced by multer.
// Pass the field name and optional constraints.
export const validateFileUpload = (field, options = {}) => {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const allowedMime = options.allowedMime ?? DEFAULT_ALLOWED_MIME
  const required = options.required ?? false

  return (req, res, next) => {
    const file = req.file || (field ? req.files?.[field] : req.files?.[0])

    if (required && !file) {
      return next(new ApiError(400, 'File upload is required'))
    }
    if (!file) return next()

    const files = Array.isArray(file) ? file : [file]
    for (const f of files) {
      if (f.size > maxBytes) {
        return next(new ApiError(400, `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`))
      }
      if (allowedMime.length && !allowedMime.includes(f.mimetype)) {
        return next(new ApiError(400, `Unsupported file type: ${f.mimetype}`))
      }
    }
    next()
  }
}
