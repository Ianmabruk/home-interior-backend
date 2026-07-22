import { sanitizeObject } from '../utils/sanitize.js'

export function validateRequest(schema) {
  return (req, res, next) => {
    const source = { ...req.body, ...req.query, ...req.params }
    const cleaned = {}
    const errors = {}

    for (const [field, rules] of Object.entries(schema)) {
      const value = source[field]
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} is required`
        continue
      }
      if (value === undefined || value === null) continue
      if (typeof value === 'string') {
        cleaned[field] = sanitizeObject({ [field]: value })[field]
      } else {
        cleaned[field] = value
      }
    }

    req.validated = cleaned
    req.validationErrors = errors

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors })
    }
    next()
  }
}
