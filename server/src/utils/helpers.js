export const withId = (item) => ({ ...item, _id: item.id })
export const withIdArray = (items) => items.map((item) => withId(item))

export const parseMaybeJson = (value, fallback = null) => {
  if (typeof value !== 'string') return fallback
  try { return JSON.parse(value) } catch { return fallback }
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
