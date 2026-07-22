/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

// TEMP AUTH BYPASS - REMOVE BEFORE PRODUCTION
export const AuthProvider = ({ children }) => {
  const [user] = useState({ id: 'temp-admin', role: 'ADMIN', email: 'admin@hokinterior.com' })
  const loading = false

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: true,
      isAdmin: true,
      login: async () => {},
      register: async () => {},
      logout: async () => {
        localStorage.removeItem('hok_access_token')
      },
      resetPassword: async () => {},
      refreshUser: async () => {},
    }),
    [user],
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
