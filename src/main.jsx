import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ErrorBoundary>
          <AuthProvider>
            <ShopProvider>
              <CurrencyProvider>
                <App />
              </CurrencyProvider>
            </ShopProvider>
          </AuthProvider>
        </ErrorBoundary>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
