import { ApiError } from './ApiError.js'

// Extract the field name Prisma rejects as unknown, e.g.
// "Unknown argument `description`. Available arguments are: ...".
const extractUnknownField = (message = '') => {
  const m = message.match(/Unknown (?:argument|arg)\s+[`']?(\w+)[`']?/i)
  return m ? m[1] : null
}

// Extract the column name from a P2022 error, e.g.
// "The column `last_login_at` does not exist in the current database."
const extractMissingColumn = (message = '') => {
  const m = message.match(/column\s+[`']?(\w+)[`']?\s+does not exist/i)
  return m ? m[1] : null
}

const COLUMN_TO_FIELD = {
  refresh_token: 'refreshToken',
  password_reset_token: 'passwordResetToken',
  password_reset_expires: 'passwordResetExpires',
  last_login_at: 'lastLoginAt',
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
      const isJsonConversion =
        err?.code === 'P2023' ||
        (err?.name === 'PrismaClientKnownRequestError' && err?.message?.includes('Could not convert value'))
      if (!isValidation && !isMissingColumn && !isJsonConversion) throw err

      let field = extractUnknownField(err.message)
      if ((!field || !(field in current)) && isMissingColumn && 'mediaSettings' in current) {
        field = 'mediaSettings'
      }
      if ((!field || !(field in current)) && isMissingColumn) {
        const col = extractMissingColumn(err.message)
        if (col) {
          field = COLUMN_TO_FIELD[col] || col
        }
      }
      if ((!field || !(field in current)) && isJsonConversion) {
        const m = err.message.match(/field\s+[`']?(\w+)[`']?/i)
        if (m) field = m[1]
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
