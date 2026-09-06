import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Timeout configuration:
// - Regular requests: 30s
// - Order requests: 120s (order creation may involve database transactions, stock updates, and notifications)
// - Upload requests: 120s (for large file uploads)
const REGULAR_TIMEOUT = 30000
const ORDER_TIMEOUT = 120000
const UPLOAD_TIMEOUT = 120000

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REGULAR_TIMEOUT,
})

api.defaults.timeout = REGULAR_TIMEOUT

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

let refreshingPromise = null
let refreshFailed = false
let csrfToken = null

function getStoredCsrfToken() {
  if (csrfToken) return csrfToken
  try {
    const stored = localStorage.getItem('hok_csrf_token')
    if (stored) csrfToken = stored
  } catch {
    // localStorage unavailable
  }
  return csrfToken
}

function setStoredCsrfToken(token) {
  csrfToken = token
  try {
    localStorage.setItem('hok_csrf_token', token)
  } catch {
    // localStorage unavailable
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hok_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const csrf = getStoredCsrfToken()
  if (csrf) {
    config.headers['x-csrf-token'] = csrf
  }

  const url = config.url || ''
  if (CONTENT_PATHS.some((p) => url === p || url.startsWith(p + '/'))) {
    config.url = '/content' + url
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'success' in data && data.success === true) {
      const result = { ...response, data: data.data ?? null }
      if (data.meta) result.meta = data.meta
      if (data.data?.csrfToken) setStoredCsrfToken(data.data.csrfToken)
      return result
    }
    if (data?.csrfToken) setStoredCsrfToken(data.csrfToken)
    return response
  },
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error.config

    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh') && !originalRequest.url?.includes('/auth/csrf')) {
      if (refreshFailed) {
        const message = error?.response?.data?.message || error?.message || 'Session expired'
        return Promise.reject(new Error(message))
      }

      if (!refreshingPromise) {
        console.info('[auth] access token expired — attempting refresh')
        refreshingPromise = api
          .post('/auth/refresh')
          .then((res) => {
            const accessToken = res.data?.accessToken
            if (!accessToken) throw new Error('No access token in refresh response')
            localStorage.setItem('hok_access_token', accessToken)
            if (res.data?.csrfToken) setStoredCsrfToken(res.data.csrfToken)
            console.info('[auth] access token refreshed')
            return accessToken
          })
          .catch((refreshErr) => {
            console.warn('[auth] refresh failed:', refreshErr?.response?.status, refreshErr?.message)
            localStorage.removeItem('hok_access_token')
            refreshFailed = true
            try {
              window.dispatchEvent(new CustomEvent('hok-auth-failed'))
            } catch {
              // ignore event dispatch errors
            }
            return Promise.reject(refreshErr)
          })
          .finally(() => {
            refreshingPromise = null
          })
      }

      try {
        await new Promise((r) => setTimeout(r, 200))
        const newToken = await refreshingPromise
        originalRequest._retry = true
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        return Promise.reject(error)
      }
    }

    if (status === 403 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh') && !originalRequest.url?.includes('/auth/csrf')) {
      // Only retry on CSRF token rejection, not on authorization failures.
      // A 403 from authorize('ADMIN') or similar should not trigger token refresh.
      const isCsrfError = error?.response?.data?.message?.includes('CSRF') || error?.response?.data?.message?.includes('csrf')
      if (!isCsrfError) {
        return Promise.reject(new Error('Access forbidden. You do not have permission to perform this action.'))
      }
      console.info('[auth] CSRF token rejected — refreshing and retrying')
      originalRequest._retry = true
      try {
        if (!refreshingPromise) {
          refreshingPromise = api
            .post('/auth/refresh')
            .then((res) => {
              const accessToken = res.data?.accessToken
              if (accessToken) {
                localStorage.setItem('hok_access_token', accessToken)
                if (res.data?.csrfToken) setStoredCsrfToken(res.data.csrfToken)
              }
              console.info('[auth] token refreshed after CSRF rejection')
              return accessToken || true
            })
            .catch((refreshErr) => {
              console.warn('[auth] CSRF refresh failed:', refreshErr?.response?.status, refreshErr?.message)
              localStorage.removeItem('hok_access_token')
              refreshFailed = true
              return Promise.reject(refreshErr)
            })
            .finally(() => {
              refreshingPromise = null
            })
        }
        await refreshingPromise
        return api(originalRequest)
      } catch {
        return Promise.reject(error)
      }
    }

    let message
    if (status === 401) {
      message = 'Unauthorized. Please log in again.'
    } else if (status === 403) {
      message = 'Access forbidden. You do not have permission to perform this action.'
    } else {
      message = error?.response?.data?.message || error?.message || 'Request failed'
    }
    return Promise.reject(new Error(message))
  },
)

const shouldCache = (config) => {
  const method = (config.method || 'get').toLowerCase()
  if (method !== 'get') return false
  const url = config.url || ''
  if (url.includes('/auth/')) return false
  if (url.includes('/upload')) return false
  if (url.includes('/delete')) return false
  if (url.includes('/newsletter')) return false
  if (url.startsWith('/content/auth')) return false
  if (url.includes('/admin/')) return false
  if (url.includes('/orders')) return false
  if (url.includes('/consultations')) return false
  return true
}

const originals = { get: api.get, post: api.post, put: api.put, patch: api.patch, delete: api.delete }

function isUploadRequest(config) {
  const data = config.data
  return (
    (config.method === 'post' || config.method === 'patch' || config.method === 'put') &&
    (data instanceof FormData || data?.[Symbol.iterator] === FormData.prototype[Symbol.iterator])
  )
}

function getRequestTimeout(config) {
  if (isUploadRequest(config)) return UPLOAD_TIMEOUT
  const url = config.url || ''
  if (url.includes('/orders')) return ORDER_TIMEOUT
  return REGULAR_TIMEOUT
}

api.get = function (url, config) {
  const merged = { ...config, timeout: config?.timeout ?? getRequestTimeout({ ...config, method: 'get', url }) }
  if (!shouldCache({ url, ...merged })) {
    return originals.get.call(api, url, merged)
  }
  const cacheKey = `get:${url}:${JSON.stringify(merged?.params || {})}`
  const cached = requestCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const cachedData = cached.data
    // Apply the same response transformation as the interceptor
    let resultData
    if (cachedData && typeof cachedData === 'object' && 'success' in cachedData && cachedData.success === true) {
      resultData = cachedData.data ?? null
    } else {
      resultData = cachedData ?? null
    }
    return Promise.resolve({
      data: resultData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url, method: 'get' },
    })
  }
  return originals.get.call(api, url, merged).then((response) => {
    requestCache.set(cacheKey, { data: response.data, timestamp: Date.now() })
    return response
  })
}

api.post = function (url, data, config) {
  const merged = { ...config, timeout: config?.timeout ?? getRequestTimeout({ ...config, method: 'post', url, data }) }
  return originals.post.call(api, url, data, merged).then((response) => {
    clearApiCache()
    return response
  })
}

api.put = function (url, data, config) {
  const merged = { ...config, timeout: config?.timeout ?? getRequestTimeout({ ...config, method: 'put', url, data }) }
  return originals.put.call(api, url, data, merged).then((response) => {
    clearApiCache()
    return response
  })
}

api.patch = function (url, data, config) {
  const merged = { ...config, timeout: config?.timeout ?? getRequestTimeout({ ...config, method: 'patch', url, data }) }
  return originals.patch.call(api, url, data, merged).then((response) => {
    clearApiCache()
    return response
  })
}

api.delete = function (url, config) {
  const merged = { ...config, timeout: config?.timeout ?? getRequestTimeout({ ...config, method: 'delete', url }) }
  return originals.delete.call(api, url, merged).then((response) => {
    clearApiCache()
    return response
  })
}

export function getCacheStats() {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys()),
  }
}

export function clearApiCache(pattern) {
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

export function getCancelable(url, config = {}) {
  const controller = new AbortController()
  const merged = { ...config, signal: controller.signal }
  return {
    data: api.get(url, merged),
    controller,
  }
}

export default api
