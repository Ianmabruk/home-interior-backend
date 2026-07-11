import { jest } from '@jest/globals'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createMockPrisma, resetMockPrisma } from './helpers.js'

const mockPrisma = createMockPrisma()

jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: mockPrisma,
}))

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  verifyCloudinaryConfig: jest.fn().mockResolvedValue(true),
  uploadToCloudinary: jest.fn().mockResolvedValue({
    url: 'https://test.cloudinary.com/image.jpg',
    publicId: 'test-public-id',
  }),
  default: {},
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
    jest.clearAllMocks()
    resetMockPrisma(mockPrisma)
  })

  describe('GET /api/products', () => {
    it('should list all published products', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 'prod-1',
          name: 'Test Product',
          price: 100,
          discountPrice: 80,
          category: 'Living Room',
          images: [{ url: 'test.jpg' }],
          stock: 10,
          isPublished: true,
        }
      ])

      const response = await request(app)
        .get('/api/products')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.items).toHaveLength(1)
    })

    it('should filter products by category', async () => {
      mockPrisma.product.findMany.mockResolvedValue([])

      const response = await request(app)
        .get('/api/products')
        .query({ category: 'Living Room' })

      expect(response.status).toBe(200)
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Living Room',
          }),
        })
      )
    })
  })

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.product.create.mockResolvedValue({
        id: 'prod-1',
        name: 'New Product',
        price: 100,
        category: 'Living Room',
        stock: 10,
      })

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Product',
          description: 'A great product for testing',
          price: 100,
          category: 'Living Room',
          stock: 10,
          sku: 'TEST-001',
          images: [],
          colorVariants: [],
          tags: [],
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
        isActive: true,
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
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        name: 'Old Name',
        price: 100,
      })
      mockPrisma.product.update.mockResolvedValue({
        id: 'prod-1',
        name: 'New Name',
        price: 100,
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
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        name: 'Test Product',
      })
      mockPrisma.product.delete.mockResolvedValue({
        id: 'prod-1',
      })

      const response = await request(app)
        .delete('/api/products/prod-1')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
    })
  })
})
