import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ShopProvider } from '../context/ShopContext'
import { CurrencyProvider } from '../context/CurrencyContext'

vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="search">Search</span>,
  Filter: () => <span data-testid="filter">Filter</span>,
  Grid: () => <span data-testid="grid">Grid</span>,
  List: () => <span data-testid="list">List</span>,
  Heart: () => <span data-testid="heart">Heart</span>,
  ShoppingBag: () => <span data-testid="shopping-bag">Bag</span>,
  ChevronDown: () => <span data-testid="chevron">↓</span>,
  Square: () => <span data-testid="square">Square</span>,
  PictureInPicture: () => <span data-testid="picture">Picture</span>,
  Armchair: () => <span data-testid="armchair">Armchair</span>,
  SlidersHorizontal: () => <span data-testid="sliders">Sliders</span>,
  X: () => <span data-testid="x">X</span>,
  Menu: () => <span data-testid="menu">Menu</span>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ children }) => <span>{children}</span>,
    useNavigate: () => vi.fn(),
  }
})

import { ShopPage } from '../pages/public/ShopPage'

const renderWithProviders = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test', route)
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <CurrencyProvider>
            {ui}
          </CurrencyProvider>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('ShopPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders shop page filter controls', () => {
    renderWithProviders(<ShopPage />)
    expect(screen.getByText('Filters')).toBeDefined()
  })

  it('renders filters section', () => {
    renderWithProviders(<ShopPage />)
    expect(screen.getByText('Filters')).toBeDefined()
  })
})
