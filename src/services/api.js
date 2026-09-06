const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const REGULAR_TIMEOUT = 30000
const ORDER_TIMEOUT = 120000
const UPLOAD_TIMEOUT = 120000

function getRequestTimeout(url) {
  if (url.includes('/orders')) return ORDER_TIMEOUT
  if (url.includes('/upload')) return UPLOAD_TIMEOUT
  return REGULAR_TIMEOUT
}

function joinUrl(base, path) {
  if (!path) return base
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return base + path
  return `${base}/${path}`
}

const CONTENT_PATHS = [
  '/homepage',
  '/portfolio',
  '/virtual-design',
  '/services',
  '/about',
  '/hero-media',
  '/consultations',
  '/media',
  '/test-upload',
  '/work-with-us',
]

function rewriteContentPath(url) {
  for (const prefix of CONTENT_PATHS) {
    if (url === prefix || url.startsWith(prefix + '/')) {
      return '/content' + url
    }
  }
  return url
}

function getAuthHeader() {
  const token = localStorage.getItem('hok_access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getCsrfHeader() {
  if (!csrfToken) {
    try {
      csrfToken = localStorage.getItem('hok_csrf_token')
    } catch {
      // ignore
    }
  }
  return csrfToken ? { 'x-csrf-token': csrfToken } : {}
}

function serializeBody(body) {
  if (body instanceof FormData) return body
  if (body == null) return undefined
  if (typeof body === 'string') return body
  return JSON.stringify(body)
}

async function request(method, url, config = {}) {
  const timeout = getRequestTimeout(url)
  const fullUrl = joinUrl(API_BASE_URL, url)
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...getCsrfHeader(),
    ...(config.headers || {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const signal = config.signal
    ? combineSignals(controller.signal, config.signal)
    : controller.signal

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: config.data !== undefined ? serializeBody(config.data) : undefined,
      signal,
      credentials: 'include',
    })

    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const data = isJson ? await response.json() : undefined

    if (!response.ok) {
      const message =
        (data && typeof data === 'object' && data.message) ||
        data ||
        response.statusText ||
        'Request failed'
      const error = new Error(message)
      error.status = response.status
      error.response = { status: response.status, data }
      throw error
    }

    return { data, status: response.status, headers: response.headers, config: { url, method } }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      const canceled = new Error('Request canceled')
      canceled.name = 'CanceledError'
      canceled.code = 'ERR_CANCELED'
      throw canceled
    }
    throw err
  }
}

function combineSignals(a, b) {
  if (!b) return a
  const combined = new AbortController()
  const handler = () => combined.abort()
  if (a.aborted) handler()
  else a.addEventListener('abort', handler)
  if (b.aborted) handler()
  else b.addEventListener('abort', handler)
  return combined.signal
}

const api = {
  get(url, config = {}) {
    const rewritten = rewriteContentPath(url)
    return request('GET', rewritten, config)
  },
  post(url, data, config = {}) {
    const rewritten = rewriteContentPath(url)
    return request('POST', rewritten, { ...config, data })
  },
  put(url, data, config = {}) {
    const rewritten = rewriteContentPath(url)
    return request('PUT', rewritten, { ...config, data })
  },
  patch(url, data, config = {}) {
    const rewritten = rewriteContentPath(url)
    return request('PATCH', rewritten, { ...config, data })
  },
  delete(url, config = {}) {
    const rewritten = rewriteContentPath(url)
    return request('DELETE', rewritten, config)
  },
}

const requestCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

function cleanExpiredCacheEntries() {
  const now = Date.now()
  for (const [key, entry] of requestCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      requestCache.delete(key)
    }
  }
}

setInterval(cleanExpiredCacheEntries, 60 * 1000)

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
const MAX_RETRIES = 2
const BASE_DELAY = 1000

function getRetryDelay(attempt) {
  return Math.min(BASE_DELAY * Math.pow(2, attempt), 8000)
}

async function withRetry(fn, signal) {
  let lastError
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt >= MAX_RETRIES) break
      if (signal?.aborted) break
      const status = err?.response?.status || err?.status
      if (!RETRYABLE_STATUS.has(status) && status !== undefined) break
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') break
      if (err?.name === 'TypeError' && !status) break
      await new Promise((r) => setTimeout(r, getRetryDelay(attempt)))
    }
  }
  throw lastError
}

let csrfToken = null

function setStoredCsrfToken(token) {
  csrfToken = token
  try {
    localStorage.setItem('hok_csrf_token', token)
  } catch {
    // ignore
  }
}



api.get = function (url, config = {}) {
  const rewritten = rewriteContentPath(url)
  const timeout = getRequestTimeout(rewritten)
  const fullUrl = joinUrl(API_BASE_URL, rewritten)
  const headers = {
    ...getAuthHeader(),
    ...getCsrfHeader(),
    ...(config.headers || {}),
  }

  const cacheKey = `get:${rewritten}:${JSON.stringify(config?.params || {})}`
  const cached = requestCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: rewritten, method: 'get' },
    })
  }

  const params = config.params
    ? '?' +
      Object.entries(config.params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : ''

  return withRetry(
    () => {
      const attemptController = new AbortController()
      const attemptTimeoutId = setTimeout(() => attemptController.abort(), timeout)
      const signal = config.signal
        ? combineSignals(attemptController.signal, config.signal)
        : attemptController.signal

      return fetch(`${fullUrl}${params}`, {
        method: 'GET',
        headers,
        signal,
        credentials: 'include',
      })
        .then(async (response) => {
          clearTimeout(attemptTimeoutId)
          const contentType = response.headers.get('content-type') || ''
          const isJson = contentType.includes('application/json')
          const data = isJson ? await response.json() : undefined

          if (!response.ok) {
            const message =
              (data && typeof data === 'object' && data.message) ||
              data ||
              response.statusText ||
              'Request failed'
            const error = new Error(message)
            error.status = response.status
            error.response = { status: response.status, data }
            throw error
          }

          if (data && typeof data === 'object' && 'success' in data && data.success === true) {
            const result = { ...response, data: data.data ?? null }
            if (data.meta) result.meta = data.meta
            if (data.data?.csrfToken) setStoredCsrfToken(data.data.csrfToken)
            requestCache.set(cacheKey, { data: result.data, timestamp: Date.now() })
            return result
          }

          if (data?.csrfToken) setStoredCsrfToken(data.csrfToken)
          requestCache.set(cacheKey, { data, timestamp: Date.now() })
          return { data, status: response.status, headers: response.headers, config: { url: rewritten, method: 'get' } }
        })
        .catch((err) => {
          clearTimeout(attemptTimeoutId)
          if (err.name === 'AbortError') {
            const canceled = new Error('Request canceled')
            canceled.name = 'CanceledError'
            canceled.code = 'ERR_CANCELED'
            throw canceled
          }
          throw err
        })
    },
    config.signal,
  )
}

api.post = function (url, data, config = {}) {
  const rewritten = rewriteContentPath(url)
  const fullUrl = joinUrl(API_BASE_URL, rewritten)
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...getCsrfHeader(),
    ...(config.headers || {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), getRequestTimeout(rewritten))
  const signal = config.signal
    ? combineSignals(controller.signal, config.signal)
    : controller.signal

  const body = data instanceof FormData ? data : JSON.stringify(data)

  return fetch(fullUrl, {
    method: 'POST',
    headers,
    body,
    signal,
    credentials: 'include',
  })
    .then(async (response) => {
      clearTimeout(timeoutId)
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await response.json() : undefined

      if (!response.ok) {
        const message =
          (data && typeof data === 'object' && data.message) ||
          data ||
          response.statusText ||
          'Request failed'
        const error = new Error(message)
        error.status = response.status
        error.response = { status: response.status, data }
        throw error
      }

      if (data && typeof data === 'object' && 'success' in data && data.success === true) {
        const result = { ...response, data: data.data ?? null }
        if (data.meta) result.meta = data.meta
        if (data.data?.csrfToken) setStoredCsrfToken(data.data.csrfToken)
        clearApiCache()
        return result
      }

      if (data?.csrfToken) setStoredCsrfToken(data.csrfToken)
      clearApiCache()
      return { data, status: response.status, headers: response.headers, config: { url: rewritten, method: 'post' } }
    })
    .catch((err) => {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        const canceled = new Error('Request canceled')
        canceled.name = 'CanceledError'
        canceled.code = 'ERR_CANCELED'
        throw canceled
      }
      throw err
    })
}

api.put = function (url, data, config = {}) {
  const rewritten = rewriteContentPath(url)
  const fullUrl = joinUrl(API_BASE_URL, rewritten)
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...getCsrfHeader(),
    ...(config.headers || {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), getRequestTimeout(rewritten))
  const signal = config.signal
    ? combineSignals(controller.signal, config.signal)
    : controller.signal

  return fetch(fullUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    signal,
    credentials: 'include',
  })
    .then(async (response) => {
      clearTimeout(timeoutId)
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await response.json() : undefined

      if (!response.ok) {
        const message =
          (data && typeof data === 'object' && data.message) ||
          data ||
          response.statusText ||
          'Request failed'
        const error = new Error(message)
        error.status = response.status
        error.response = { status: response.status, data }
        throw error
      }

      if (data && typeof data === 'object' && 'success' in data && data.success === true) {
        const result = { ...response, data: data.data ?? null }
        if (data.meta) result.meta = data.meta
        if (data.data?.csrfToken) setStoredCsrfToken(data.data.csrfToken)
        clearApiCache()
        return result
      }

      if (data?.csrfToken) setStoredCsrfToken(data.csrfToken)
      clearApiCache()
      return { data, status: response.status, headers: response.headers, config: { url: rewritten, method: 'put' } }
    })
    .catch((err) => {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        const canceled = new Error('Request canceled')
        canceled.name = 'CanceledError'
        canceled.code = 'ERR_CANCELED'
        throw canceled
      }
      throw err
    })
}

api.patch = function (url, data, config = {}) {
  const rewritten = rewriteContentPath(url)
  const fullUrl = joinUrl(API_BASE_URL, rewritten)
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...getCsrfHeader(),
    ...(config.headers || {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), getRequestTimeout(rewritten))
  const signal = config.signal
    ? combineSignals(controller.signal, config.signal)
    : controller.signal

  return fetch(fullUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
    signal,
    credentials: 'include',
  })
    .then(async (response) => {
      clearTimeout(timeoutId)
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await response.json() : undefined

      if (!response.ok) {
        const message =
          (data && typeof data === 'object' && data.message) ||
          data ||
          response.statusText ||
          'Request failed'
        const error = new Error(message)
        error.status = response.status
        error.response = { status: response.status, data }
        throw error
      }

      if (data && typeof data === 'object' && 'success' in data && data.success === true) {
        const result = { ...response, data: data.data ?? null }
        if (data.meta) result.meta = data.meta
        if (data.data?.csrfToken) setStoredCsrfToken(data.data.csrfToken)
        clearApiCache()
        return result
      }

      if (data?.csrfToken) setStoredCsrfToken(data.csrfToken)
      clearApiCache()
      return { data, status: response.status, headers: response.headers, config: { url: rewritten, method: 'patch' } }
    })
    .catch((err) => {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        const canceled = new Error('Request canceled')
        canceled.name = 'CanceledError'
        canceled.code = 'ERR_CANCELED'
        throw canceled
      }
      throw err
    })
}

api.delete = function (url, config = {}) {
  const rewritten = rewriteContentPath(url)
  const fullUrl = joinUrl(API_BASE_URL, rewritten)
  const headers = {
    ...getAuthHeader(),
    ...getCsrfHeader(),
    ...(config.headers || {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), getRequestTimeout(rewritten))
  const signal = config.signal
    ? combineSignals(controller.signal, config.signal)
    : controller.signal

  return fetch(fullUrl, {
    method: 'DELETE',
    headers,
    signal,
    credentials: 'include',
  })
    .then(async (response) => {
      clearTimeout(timeoutId)
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await response.json() : undefined

      if (!response.ok) {
        const message =
          (data && typeof data === 'object' && data.message) ||
          data ||
          response.statusText ||
          'Request failed'
        const error = new Error(message)
        error.status = response.status
        error.response = { status: response.status, data }
        throw error
      }

      if (data && typeof data === 'object' && 'success' in data && data.success === true) {
        const result = { ...response, data: data.data ?? null }
        if (data.meta) result.meta = data.meta
        if (data.data?.csrfToken) setStoredCsrfToken(data.data.csrfToken)
        clearApiCache()
        return result
      }

      if (data?.csrfToken) setStoredCsrfToken(data.csrfToken)
      clearApiCache()
      return { data, status: response.status, headers: response.headers, config: { url: rewritten, method: 'delete' } }
    })
    .catch((err) => {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        const canceled = new Error('Request canceled')
        canceled.name = 'CanceledError'
        canceled.code = 'ERR_CANCELED'
        throw canceled
      }
      throw err
    })
}

function getCacheStats() {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys()),
  }
}

function clearApiCache(pattern) {
  if (!pattern) {
    requestCache.clear()
    return
  }
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key)
    }
  }
}

function getCancelable(url, config = {}) {
  const controller = new AbortController()
  const merged = { ...config, signal: controller.signal }
  return {
    data: api.get(url, merged),
    controller,
  }
}

export { api, getCacheStats, clearApiCache, getCancelable }
