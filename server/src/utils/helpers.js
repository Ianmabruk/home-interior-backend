import { ApiError } from './ApiError.js'

// Null-safe: several controllers (e.g. homepageFeed) pass the result of
// findFirst() which can be `null`. The previous `{ ...item, _id: item.id }`
// threw "Cannot read properties of null" and 500'd the whole response (the
// homepage feed in particular). Returning null through keeps the contract
// `{ data: null }` that callers already handle.
export const withId = (item) => (item == null ? item : { ...item, _id: item.id })
export const withIdArray = (items) => (Array.isArray(items) ? items : []).map((item) => withId(item))

export const parseMaybeJson = (value, fallback = null) => {
  if (typeof value !== 'string') return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

// Accepts a field that may arrive as a JSON array, a JSON-encoded array
// string, or a plain comma-separated string (how the admin forms submit
// tag/list fields). Always returns an array; falls back to `fallback` ([]) for
// empty/undefined/non-string/non-array input. This keeps the request contract
// in sync with the frontend (which posts comma-separated strings) so a valid
// product/project submission is never rejected as "expected array, received
// string" nor silently loses the user's tags.
export const parseListField = (value, fallback = []) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return fallback
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // not JSON — treat as comma-separated below
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return fallback
}

export const DEFAULT_MEDIA_SETTINGS = { position: 'center', zoom: 100, fit: 'cover' }

export const ALLOWED_POSITIONS = new Set([
  'center', 'top', 'bottom', 'left', 'right',
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
])

export const ALLOWED_FITS = new Set(['contain', 'cover', 'fill', 'scale-down'])

export const ALLOWED_ZOOMS = new Set([50, 75, 100, 125, 150])

export const parseMediaSettings = (value) => {
  const parsed = typeof value === 'string'
    ? parseMaybeJson(value, null)
    : (value && typeof value === 'object' ? value : null)
  if (!parsed || typeof parsed !== 'object') return null

  const position = ALLOWED_POSITIONS.has(parsed.position) ? parsed.position : DEFAULT_MEDIA_SETTINGS.position
  const fit = ALLOWED_FITS.has(parsed.fit) ? parsed.fit : DEFAULT_MEDIA_SETTINGS.fit
  const zoomNumber = Number(parsed.zoom)
  const zoom = ALLOWED_ZOOMS.has(zoomNumber) ? zoomNumber : DEFAULT_MEDIA_SETTINGS.zoom

  return { position, zoom, fit }
}

export const parseBody = (schema, body) => {
  const result = schema.safeParse(body)
  if (!result.success) {
    const issues = result.error.issues || []
    const message = issues.map((e) => {
      const path = Array.isArray(e.path) && e.path.length ? `${e.path.join('.')}: ` : ''
      return `${path}${e.message}`
    }).join(', ') || 'Validation error'
    throw new ApiError(400, message, issues)
  }
  return result.data
}

export const sortByOrderThenDate = (items) => items.sort((a, b) => {
  const orderDiff = (a.displayOrder || a.display_order || 0) - (b.displayOrder || b.display_order || 0)
  if (orderDiff !== 0) return orderDiff
  return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
})

export const orderValue = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export const toNumberIfFinite = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export const toBoolean = (value, fallback) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return fallback
}
