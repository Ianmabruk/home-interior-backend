import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // TEMP AUTH BYPASS - REMOVE BEFORE PRODUCTION
  it('initializes with temp admin user when no token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.user).toEqual({ id: 'temp-admin', role: 'ADMIN', email: 'admin@hokinterior.com' })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('provides login and logout functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })
})
