import { ApiError } from '../utils/ApiError.js'
import { verifyAccessToken } from '../utils/tokens.js'

export const auth = (req, res, next) => {
  const header = req.headers.authorization || req.headers.Authorization
  if (!header || !header.startsWith('Bearer ')) {
    console.warn(`[AUTH][${res.getHeader('X-Request-ID')}] rejected: missing authorization header`)
    return next(new ApiError(401, 'Unauthorized'))
  }

  try {
    const token = header.split(' ')[1]
    const decoded = verifyAccessToken(token)
    req.user = decoded
    console.info(`[AUTH][${res.getHeader('X-Request-ID')}] granted: userId=${decoded.userId} role=${decoded.role}`)
    next()
  } catch (err) {
    console.warn(`[AUTH][${res.getHeader('X-Request-ID')}] rejected: invalid token — ${err?.message}`)
    next(new ApiError(401, 'Invalid token'))
  }
}

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden'))
  }

  next()
}
