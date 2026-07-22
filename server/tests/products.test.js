import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createChain, resetMockSupabase } from './helpers.js'

const builder = createChain()

jest.unstable_mockModule('../src/config/env.js', () => ({
  env: {
    nodeEnv: 'test',
    port: 5000,
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
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'
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

describe('Product Management', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    resetMockSupabaseAfterEach()
  })

  describe('GET /api/products', () => {
    it('should list all published products', async () => {
      builder.setResolveWith({
        data: [
          {
            id: 'prod-1',
            name: 'Test Product',
            price: 100,
            discount_price: 80,
            category: 'Living Room',
            images: [{ url: 'test.jpg' }],
            stock: 10,
            is_published: true,
          }
        ],
        count: 1,
        error: null,
      })

      const response = await request(app)
        .get('/api/products')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.items).toHaveLength(1)
    })

    it('should filter products by category', async () => {
      builder.setResolveWith({
        data: [],
        count: 0,
        error: null,
      })

      const response = await request(app)
        .get('/api/products')
        .query({ category: 'Living Room' })

      expect(response.status).toBe(200)
      expect(response.body.data.items).toHaveLength(0)
    })
  })

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.single.mockResolvedValueOnce({
        data: { id: 'prod-1', name: 'New Product', price: 100, category: 'Living Room', stock: 10 },
        error: null,
      })

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Product',
          description: 'A great product for testing',
          price: 100,
          category: 'Mirrors',
          stock: 10,
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })

    it('should reject product creation without auth', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'New Product',
          price: 100,
        })

      expect(response.status).toBe(401)
    })

    it('should reject product creation as non-admin', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        is_active: true,
      }
      const token = generateToken(user)

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Product',
          price: 100,
        })

      expect(response.status).toBe(403)
    })
  })

  describe('PATCH /api/products/:id', () => {
    it('should update product as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.single.mockResolvedValueOnce({
        data: { id: 'prod-1', name: 'Old Name', price: 100 },
        error: null,
      })
      builder.single.mockResolvedValueOnce({
        data: { id: 'prod-1', name: 'New Name', price: 100 },
        error: null,
      })

      const response = await request(app)
        .patch('/api/products/prod-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Name',
        })

      expect(response.status).toBe(200)
      expect(response.body.data.name).toBe('New Name')
    })
  })

  describe('DELETE /api/products/:id', () => {
    it('should delete product as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      }
      const token = generateToken(admin)

      builder.single.mockResolvedValueOnce({
        data: { id: 'prod-1', name: 'Test Product', images: [] },
        error: null,
      })
      builder.setResolveWith({
        data: null,
        error: null,
      })

      const response = await request(app)
        .delete('/api/products/prod-1')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
    })
  })
})
