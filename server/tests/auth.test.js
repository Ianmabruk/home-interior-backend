import { jest } from '@jest/globals'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  portfolio: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  about: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  virtualDesign: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  settings: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  wishlist: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  analytics: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
}

jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: mockPrisma,
}))

jest.unstable_mockModule('../src/config/sendgrid.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  buildAdminTestEmailTemplate: jest.fn().mockReturnValue('<html></html>'),
  buildWelcomeEmailTemplate: jest.fn().mockReturnValue('<html></html>'),
  buildLoginEmailTemplate: jest.fn().mockReturnValue('<html></html>'),
  buildNewProductEmailTemplate: jest.fn().mockReturnValue('<html></html>'),
  buildQuoteEmailTemplate: jest.fn().mockReturnValue('<html></html>'),
  buildReceiptEmailTemplate: jest.fn().mockReturnValue('<html></html>'),
}))

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  verifyCloudinaryConfig: jest.fn().mockResolvedValue(true),
  uploadToCloudinary: jest.fn().mockResolvedValue({
    url: 'https://test.cloudinary.com/image.jpg',
    publicId: 'test-public-id',
  }),
  default: {},
}))

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.NODE_ENV = 'test'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'
process.env.SENDGRID_API_KEY = 'test-sendgrid'
process.env.SEED_ADMIN_EMAIL = 'admin@test.com'
process.env.SEED_ADMIN_PASSWORD = 'admin123'
process.env.CLIENT_URL = 'http://localhost:5173'

const resetMockPrisma = () => {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function') {
          method.mockClear()
          method.mockImplementation(() => Promise.resolve(undefined))
        }
      })
    }
  })
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
    jest.clearAllMocks()
    resetMockPrisma()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        fullName: 'Test User',
        role: 'user',
        isActive: true,
      })
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        refreshToken: 'new-refresh-token',
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
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        fullName: 'Test User',
        role: 'user',
        isActive: true,
        refreshToken: null,
      })
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        refreshToken: 'new-refresh-token',
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
      mockPrisma.user.findUnique.mockResolvedValue(null)

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
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        isActive: true,
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
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        isActive: false,
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
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        isActive: true,
        refreshToken,
      })
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        refreshToken: 'new-refresh-token',
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
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        refreshToken: null,
      })

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
