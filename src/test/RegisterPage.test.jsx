import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ShopProvider } from '../context/ShopContext'

vi.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right">→</span>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ children }) => <span>{children}</span>,
    useNavigate: () => vi.fn(),
  }
})

import { RegisterPage } from '../pages/auth/RegisterPage'

const renderWithProviders = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test', route)
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          {ui}
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders registration form inputs', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByText('Full Name')).toBeDefined()
    expect(screen.getByText('Email Address')).toBeDefined()
    expect(screen.getByText('Password')).toBeDefined()
    expect(screen.getByText('Confirm Password')).toBeDefined()
  })

  it('renders create account button', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined()
  })
})
