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

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'success' in data) {
      return { ...response, data: data.data ?? null }
    }
    return response
  },
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error.config

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (!refreshingPromise) {
      refreshingPromise = api
        .post('/auth/refresh')
        .then((res) => {
          localStorage.setItem('hok_access_token', res.data.accessToken)
          return res.data.accessToken
        })
        .finally(() => {
          refreshingPromise = null
        })
    }

    const newToken = await refreshingPromise
    originalRequest.headers.Authorization = `Bearer ${newToken}`

    return api(originalRequest)
  },
)
