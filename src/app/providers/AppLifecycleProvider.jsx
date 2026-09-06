import { useCallback } from 'react'
import { useAppLifecycle } from '@hooks/useAppLifecycle'
import { useAuth } from '@context/AuthContext'

export function AppLifecycleProvider({ children }) {
  const validateSession = useAuth().validateSession

  const handleVisible = useCallback(() => {
    const token = localStorage.getItem('hok_access_token')
    if (token) {
      validateSession()
    }
  }, [validateSession])

  useAppLifecycle({
    onVisible: handleVisible,
    onOnline: () => {
      console.log('[APP] Connection restored')
    },
    onOffline: () => {
      console.warn('[APP] Connection lost')
    },
  })

  return <>{children}</>
}
