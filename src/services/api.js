import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Required so the httpOnly refresh cookie is sent on cross-origin requests
  // to the API (localhost dev port or the deployed API domain).
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hok_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
      return Promise.reject(error)
    }

    // If a previous refresh attempt failed, stop retrying to avoid hitting
    // rate limits and causing infinite loops. The user must log in again.
    if (refreshFailed) {
      return Promise.reject(error)
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
