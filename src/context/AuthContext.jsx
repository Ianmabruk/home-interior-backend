/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('hok_access_token'))

  useEffect(() => {
    const token = localStorage.getItem('hok_access_token')
    if (!token) {
      return
    }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data || null)
      })
      .catch(() => {
        localStorage.removeItem('hok_access_token')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const accessToken = res.data?.accessToken
    if (accessToken) {
      localStorage.setItem('hok_access_token', accessToken)
      setUser(res.data?.user || null)
    }
    return res.data
  }

  const register = async (fullName, email, password) => {
    const res = await api.post('/auth/register', { fullName, email, password })
    return res.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('hok_access_token')
    setUser(null)
  }

  const refreshUser = async () => {
    const res = await api.get('/auth/me')
    setUser(res.data || null)
    return res.data
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      resetPassword: async (token, password) => {
        await api.post('/auth/reset-password', { token, password })
      },
      refreshUser,
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
