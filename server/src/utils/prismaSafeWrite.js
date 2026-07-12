import { ApiError } from './ApiError.js'

// Extract the field name Prisma rejects as unknown, e.g.
// "Unknown argument `description`. Available arguments are: ...".
const extractUnknownField = (message = '') => {
  const m = message.match(/Unknown (?:argument|arg)\s+[`']?(\w+)[`']?/i)
  return m ? m[1] : null
}

/**
 * Wraps a Prisma write operation (create/update) with automatic schema-mismatch
 * recovery. If the deployed Prisma client reports an unknown field or a missing
 * DB column, the offending field is stripped and the operation is retried.
 *
 * This prevents PrismaClientValidationError from crashing requests when a
 * stale generated client is deployed ahead of its schema/migration.
 *
 * @param {Function} operation - async (payload) => PrismaResult
 * @param {object} payload - the data object intended for Prisma
 * @param {string} label - tag for log messages, e.g. "PRODUCT][CREATE"
 * @returns {Promise<*>} Prisma result
 */
export const prismaSafeWrite = async (operation, payload, label) => {
  let current = { ...payload }
  const maxAttempts = Object.keys(current).length + 1
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation(current)
    } catch (err) {
      const isValidation = err?.name === 'PrismaClientValidationError'
      const isMissingColumn =
        err?.code === 'P2022' ||
        (err?.name === 'PrismaClientKnownRequestError' && err?.message?.includes('does not exist'))
      if (!isValidation && !isMissingColumn) throw err

      let field = extractUnknownField(err.message)
      if ((!field || !(field in current)) && isMissingColumn && 'mediaSettings' in current) {
        field = 'mediaSettings'
      }
      if (!field || !(field in current)) {
        console.error(`[${label}] Prisma write failed, unrecoverable by field stripping:`, err?.message)
        throw err
      }
      console.warn(`[PRISMA SAFE FILTER] Removed field: ${field} from ${label}`)
      delete current[field]
    }
  }
  throw new ApiError(500, 'Database write failed after schema-mismatch recovery.')
}
