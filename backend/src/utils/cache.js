const cache = new Map()
const DEFAULT_TTL_MS = 30000 // 30 seconds
const MAX_CACHE_ENTRIES = 500

function pruneCache() {
  if (cache.size <= MAX_CACHE_ENTRIES) return
  const entries = [...cache.entries()]
  entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt)
  const toDelete = entries.slice(0, cache.size - MAX_CACHE_ENTRIES)
  for (const [key] of toDelete) {
    cache.delete(key)
  }
}

function cleanExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key)
    }
  }
}

setInterval(cleanExpiredEntries, 30 * 1000)
setInterval(pruneCache, 60 * 1000)

export function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.value
}

export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function invalidateCache(key) {
  cache.delete(key)
}

export function invalidateCachePattern(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

export function clearCache() {
  cache.clear()
}
