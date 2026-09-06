import { memo } from 'react'
import { AuthProvider } from '@context/AuthContext'
import { ShopProvider } from '@context/ShopContext'
import { CurrencyProvider } from '@context/CurrencyContext'
import { PageMeta } from '@hooks/usePageMeta'
import { AppLifecycleProvider } from './AppLifecycleProvider'

export const AppProviders = memo(({ children }) => (
  <AuthProvider>
    <ShopProvider>
      <CurrencyProvider>
        <PageMeta />
        <AppLifecycleProvider>
          {children}
        </AppLifecycleProvider>
      </CurrencyProvider>
    </ShopProvider>
  </AuthProvider>
))

AppProviders.displayName = 'AppProviders'