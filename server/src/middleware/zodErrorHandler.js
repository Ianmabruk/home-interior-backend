import { ApiError } from '../utils/ApiError.js'

export const zodErrorHandler = (err, req, res, next) => {
  if (err?.name === 'ZodError' || err?.issues) {
    const message = err.errors?.map((e) => e.message).join(', ') || 'Validation error'
    return res.status(400).json({ success: false, message, details: err.errors })
  }
  const plainError = err instanceof Error ? err : new Error(String(err))
  next(plainError)
}
