export function sanitizeString(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/<\/?[^>]+(>|$)/g, '').trim()
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      out[k] = v.map(sanitizeString)
    } else if (v && typeof v === 'object') {
      out[k] = sanitizeObject(v)
    } else {
      out[k] = sanitizeString(v)
    }
  }
  return out
}
