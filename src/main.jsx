import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import { CurrencyProvider } from './context/CurrencyContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <CurrencyProvider>
            <App />
          </CurrencyProvider>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
