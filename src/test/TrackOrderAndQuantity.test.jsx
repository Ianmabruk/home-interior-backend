import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const { mockAddToCart, mockAddToWishlist, mockApiGet, mockApiTrack } = vi.hoisted(() => ({
  mockAddToCart: vi.fn(),
  mockAddToWishlist: vi.fn(),
  mockApiGet: vi.fn(),
  mockApiTrack: vi.fn(),
}))

vi.mock('@components/common/DynamicMotion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

vi.mock('@hooks/usePageMeta', () => ({
  PageMeta: () => null,
}))

vi.mock('@services/api', () => ({
  api: {
    get: mockApiGet,
    post: mockApiTrack,
  },
}))

vi.mock('@context/ShopContext', () => ({
  useShop: () => ({
    addToCart: mockAddToCart,
    addToWishlist: mockAddToWishlist,
    wishlist: [],
    cart: [],
  }),
}))

vi.mock('@context/CurrencyContext', () => ({
  useCurrency: () => ({
    formatPrice: (value) => `KES ${(Number(value || 0)).toFixed(2)}`,
  }),
}))

vi.mock('@hooks/useZoom', () => ({
  useZoom: () => ({
    style: {},
    scale: 1,
    handleWheel: vi.fn(),
    handleMouseDown: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock('@components/common/OptimizedImage', () => ({
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}))

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { ProductDetailPage } from '../pages/public/ProductDetailPage'
import { TrackOrderPage } from '../pages/public/TrackOrderPage'

describe('Product detail quantity controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({
      data: {
        _id: 'product-123',
        name: 'Test Product',
        stock: 3,
        price: 1500,
        description: 'Demo description',
        images: ['https://example.com/image.jpg'],
        variants: [{
          _id: 'variant-1',
          id: 'variant-1',
          color: 'Red',
          image: 'https://example.com/red.jpg',
          stock: 3,
          price: 1500,
        }],
      },
    })
  })

  it('clamps invalid manual quantity input and respects stock limits', async () => {
    render(
      <MemoryRouter initialEntries={['/products/product-123']}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const quantityInput = await screen.findByRole('spinbutton', { name: /quantity/i })

    fireEvent.change(quantityInput, { target: { value: '99' } })
    expect(quantityInput.value).toBe('3')

    fireEvent.change(quantityInput, { target: { value: '0' } })
    expect(quantityInput.value).toBe('1')
  })
})

describe('TrackOrderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefills the tracking number from the URL query string', () => {
    render(
      <MemoryRouter initialEntries={['/track-order?tracking=HOK-123']}>
        <Routes>
          <Route path="/track-order" element={<TrackOrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/tracking number/i)).toHaveValue('HOK-123')
  })
})
