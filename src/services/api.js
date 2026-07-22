import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

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
  '/analytics',
]

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hok_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const url = config.url || ''
  if (CONTENT_PATHS.some((p) => url === p || url.startsWith(p + '/'))) {
    config.url = '/content' + url
  }

  return config
})

let refreshingPromise = null
let refreshFailed = false

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'success' in data && data.success === true) {
      return { ...response, data: data.data ?? null }
    }
    return response
  },
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error.config

    if (status !== 401 || originalRequest._retry || originalRequest.url?.includes('/auth/refresh')) {
      const message = error?.response?.data?.message || error?.message || 'Request failed'
      return Promise.reject(new Error(message))
    }

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
          console.info('[auth] access token refreshed')
          return accessToken
        })
        .catch((refreshErr) => {
          console.warn('[auth] refresh failed:', refreshErr?.response?.status, refreshErr?.message)
          localStorage.removeItem('hok_access_token')
          refreshFailed = true
          return Promise.reject(refreshErr)
        })
        .finally(() => {
          refreshingPromise = null
        })
    }

    try {
      const newToken = await refreshingPromise
      originalRequest._retry = true
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch {
      return Promise.reject(error)
    }
  },
)
