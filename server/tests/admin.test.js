import { jest } from '@jest/globals'
import request from 'supertest'
import bcrypt from 'bcryptjs'
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

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  verifyCloudinaryConfig: jest.fn().mockResolvedValue(true),
  uploadToCloudinary: jest.fn().mockResolvedValue({
    url: 'https://test.cloudinary.com/image.jpg',
    publicId: 'test-public-id',
  }),
  default: {},
}))

const { supabase: realSupabase } = await import('../src/config/supabase.js')

process.env.JWT_ACCESS_SECRET = 'test-access-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
process.env.NODE_ENV = 'test'
process.env.SEED_ADMIN_EMAIL = 'admin@test.com'
process.env.SEED_ADMIN_PASSWORD = 'admin123'
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

describe('Admin Management', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    resetMockSupabaseAfterEach()
  })

  describe('GET /api/admin/overview', () => {
    it('should return dashboard overview for admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.setResolveWith({
        data: [
          { id: 'p1', name: 'Product 1', price: 100, stock: 5, is_published: true }
        ],
        count: 10,
        error: null,
      })

      builder.setResolveWith({
        data: [
          { id: 'u1', role: 'user', created_at: new Date().toISOString() }
        ],
        count: 10,
        error: null,
      })

      builder.setResolveWith({
        data: [
          { id: 'o1', total: 100, status: 'pending', payment_status: 'pending', created_at: new Date().toISOString(), user_id: 'u1', items: [] }
        ],
        error: null,
      })

      builder.setResolveWith({
        count: 3,
        error: null,
      })

      const response = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should reject overview access for non-admin', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        is_active: true,
      }
      const token = generateToken(user)

      const response = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/admin/users', () => {
    it('should list all users for admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.setResolveWith({
        data: [
          { id: 'user-1', email: 'user@test.com', full_name: 'User', role: 'user', is_active: true, created_at: new Date().toISOString() }
        ],
        count: 1,
        error: null,
      })

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
    })
  })

  describe('PATCH /api/admin/users/:id/:action', () => {
    it('should suspend user as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.single.mockResolvedValueOnce({
        data: { id: 'user-1', email: 'user@test.com', is_active: true },
        error: null,
      })
      builder.setResolveWith({
        data: { id: 'user-1', is_active: false },
        error: null,
      })

      const response = await request(app)
        .patch('/api/admin/users/user-1/suspend')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data.user.is_active).toBe(false)
    })

    it('should activate user as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.single.mockResolvedValueOnce({
        data: { id: 'user-1', email: 'user@test.com', is_active: false },
        error: null,
      })
      builder.setResolveWith({
        data: { id: 'user-1', is_active: true },
        error: null,
      })

      const response = await request(app)
        .patch('/api/admin/users/user-1/activate')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
    })
  })

  describe('PUT /api/admin/settings', () => {
    it('should update settings as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.setResolveWith({
        data: [{ id: 'settings-1', site_name: 'HOK', currency: 'KES' }],
        error: null,
      })
      builder.single.mockResolvedValueOnce({
        data: { id: 'settings-1', site_name: 'Updated HOK', currency: 'KES' },
        error: null,
      })

      const response = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          siteName: 'Updated HOK',
          currency: 'KES',
        })

      expect(response.status).toBe(200)
      expect(response.body.data.site_name).toBe('Updated HOK')
    })

    it('should create settings if none exist', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.setResolveWith({
        data: [],
        error: null,
      })
      builder.single.mockResolvedValueOnce({
        data: { id: 'settings-1', site_name: 'HOK', currency: 'USD' },
        error: null,
      })

      const response = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          siteName: 'HOK',
        })

      expect(response.status).toBe(201)
    })
  })

  describe('PATCH /api/admin/orders/:id/status', () => {
    it('should update order status as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.single.mockResolvedValueOnce({
        data: { id: 'order-1', status: 'pending', items: [] },
        error: null,
      })
      builder.single.mockResolvedValueOnce({
        data: { id: 'order-1', status: 'shipped' },
        error: null,
      })

      const response = await request(app)
        .patch('/api/admin/orders/order-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'shipped' })

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('shipped')
    })

    it('should reject invalid status values', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.single.mockResolvedValueOnce({
        data: { id: 'order-1', status: 'pending' },
        error: null,
      })

      const response = await request(app)
        .patch('/api/admin/orders/order-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid-status' })

      expect(response.status).toBe(400)
    })
  })
})
