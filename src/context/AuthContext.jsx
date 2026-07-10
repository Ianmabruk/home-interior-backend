/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    try {
      const response = await api.get('/users/me')
      setUser(response.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('hok_access_token')
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    loadUser()
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    // Only the short-lived access token is kept in JS storage. The refresh
    // token is delivered as an httpOnly cookie by the backend and is never
    // readable from script (XSS-safe).
    localStorage.setItem('hok_access_token', response.data.accessToken)
    setUser(response.data.user)
    return response
  }

  const register = async (fullName, email, password) => {
    const response = await api.post('/auth/register', { fullName, email, password })
    localStorage.setItem('hok_access_token', response.data.accessToken)
    setUser(response.data.user)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore network errors on logout */
    }
    localStorage.removeItem('hok_access_token')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
