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

describe('Authentication', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    resetMockSupabaseAfterEach()
  })

  it('debug auth chain in test context', async () => {
    builder.single.mockResolvedValueOnce({
      data: { id: 'user-123', email: 'test@test.com', password_hash: 'hash', full_name: 'Test User', role: 'user', is_active: true, refresh_token: null },
      error: null,
    })
    
    const result = await realSupabase.from('users').select('id').eq('email', 'test@test.com').single()
    console.log('DEBUG AUTH CHAIN RESULT', result)
    expect(result.data?.id).toBe('user-123')
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      builder.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      builder.single.mockResolvedValueOnce({
        data: { id: 'user-123', email: 'test@test.com', full_name: 'Test User', role: 'user', is_active: true, password_hash: 'hash', refresh_token: null },
        error: null,
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test@test.com',
          password: 'password123',
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@test.com')
    })

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
        })

      expect(response.status).toBe(400)
    })

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12)

      builder.single.mockResolvedValueOnce({
        data: {
          id: 'user-123',
          email: 'test@test.com',
          password_hash: hashedPassword,
          full_name: 'Test User',
          role: 'user',
          is_active: true,
          refresh_token: null,
        },
        error: null,
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
    })

    it('should reject login with invalid email', async () => {
      builder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })

      expect(response.status).toBe(401)
    })

    it('should reject login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12)
      builder.single.mockResolvedValueOnce({
        data: {
          id: 'user-123',
          email: 'test@test.com',
          password_hash: hashedPassword,
          is_active: true,
        },
        error: null,
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword',
        })

      expect(response.status).toBe(401)
    })

    it('should reject login for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12)
      builder.single.mockResolvedValueOnce({
        data: {
          id: 'user-123',
          email: 'test@test.com',
          password_hash: hashedPassword,
          is_active: false,
        },
        error: null,
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123',
        })

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12)
      const refreshToken = jwt.sign(
        { userId: 'user-123', email: 'test@test.com' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      )

      builder.single.mockResolvedValueOnce({
        data: {
          id: 'user-123',
          email: 'test@test.com',
          password_hash: hashedPassword,
          is_active: true,
          refresh_token: refreshToken,
        },
        error: null,
      })

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
    })

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
