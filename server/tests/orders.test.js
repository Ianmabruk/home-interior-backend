import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createChain, resetMockSupabase } from './helpers.js'

const builder = createChain()

jest.unstable_mockModule('../src/config/env.js', () => ({
  env: {
    nodeEnv: 'test',
    port: 5000,
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    directUrl: 'postgresql://test:test@localhost:5432/test',
    supabaseUrl: 'http://localhost',
    supabaseServiceRoleKey: 'test-key',
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    cloudinaryCloudName: 'test-cloud',
    cloudinaryApiKey: 'test-key',
    cloudinaryApiSecret: 'test-secret',
    seedAdminEmail: 'admin@test.com',
    seedAdminPassword: 'admin123',
    clientUrl: 'http://localhost:5173',
    sendgridApiKey: '',
    accessTokenTtl: '15m',
    refreshTokenTtl: '30d',
  },
}))

const { supabase: realSupabase } = await import('../src/config/supabase.js')

process.env.JWT_ACCESS_SECRET = 'test-access-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
process.env.NODE_ENV = 'test'
process.env.CLIENT_URL = 'http://localhost:5173'

const resetMockSupabaseAfterEach = () => {
  jest.clearAllMocks()
  resetMockSupabase(builder)
  realSupabase.from = jest.fn(() => builder)
  realSupabase.rpc = jest.fn(() => builder)
}

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  )
}

let app

describe('Order Management', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    resetMockSupabaseAfterEach()
  })

  describe('POST /api/orders', () => {
    it('should create order with valid items', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        is_active: true,
        fullName: 'Test User',
      }
      const token = generateToken(user)

      builder.single.mockResolvedValueOnce({
        data: { id: 'user-1', email: 'user@test.com', full_name: 'Test User', is_active: true },
        error: null,
      })
      builder.setResolveWith({
        data: [
          { id: 'prod-1234567890', name: 'Product 1', price: 100, stock: 10, images: [], color_variants: [] }
        ],
        count: 1,
        error: null,
      })
      builder.single.mockResolvedValueOnce({
        data: { id: 'order-1', total: 100, items: [], user_id: 'user-1', status: 'pending', payment_status: 'pending', shipping_address: {} },
        error: null,
      })
      builder.single.mockResolvedValueOnce({
        data: { id: 'prod-1234567890', stock: 10 },
        error: null,
      })

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: 'prod-1234567890', quantity: 1 }
          ],
          shippingAddress: {
            line1: '123 Main St',
            city: 'Nairobi',
            postalCode: '00100',
            country: 'Kenya',
          }
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })

    it('should reject order with insufficient stock', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        is_active: true,
        fullName: 'Test User',
      }
      const token = generateToken(user)

      builder.single.mockResolvedValueOnce({
        data: { id: 'user-1', email: 'user@test.com', full_name: 'Test User', is_active: true },
        error: null,
      })
      builder.setResolveWith({
        data: [
          { id: 'prod-1234567890', name: 'Product 1', price: 100, stock: 1, images: [], color_variants: [] }
        ],
        count: 1,
        error: null,
      })
      builder.single.mockResolvedValueOnce({
        data: { id: 'prod-1234567890', stock: 1 },
        error: null,
      })

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: 'prod-1234567890', quantity: 10 }
          ],
          shippingAddress: {
            line1: '123 Main St',
            city: 'Nairobi',
            postalCode: '00100',
            country: 'Kenya',
          }
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toMatch(/insufficient stock/i)
    })

    it('should reject order for non-existent product', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        is_active: true,
        fullName: 'Test User',
      }
      const token = generateToken(user)

      builder.single.mockResolvedValueOnce({
        data: { id: 'user-1', email: 'user@test.com', full_name: 'Test User', is_active: true },
        error: null,
      })
      builder.setResolveWith({
        data: [],
        count: 0,
        error: null,
      })

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: 'non-existent-1234567890', quantity: 1 }
          ],
          shippingAddress: {
            line1: '123 Main St',
            city: 'Nairobi',
            postalCode: '00100',
            country: 'Kenya',
          }
        })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/orders/me', () => {
    it('should list user orders', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        is_active: true,
      }
      const token = generateToken(user)

      builder.single.mockResolvedValueOnce({
        data: { id: 'user-1', email: 'user@test.com', full_name: 'Test User', is_active: true },
        error: null,
      })
      builder.setResolveWith({
        data: [
          { id: 'order-1', total: 100, status: 'pending', items: [] }
        ],
        error: null,
      })

      const response = await request(app)
        .get('/api/orders/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
    })
  })
})
