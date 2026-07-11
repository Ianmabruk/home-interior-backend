import { jest } from '@jest/globals'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createMockPrisma, resetMockPrisma } from './helpers.js'

const mockPrisma = createMockPrisma()

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

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.NODE_ENV = 'test'
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

describe('Admin Management', () => {
  beforeAll(async () => {
    jest.resetModules()
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    jest.clearAllMocks()
    resetMockPrisma(mockPrisma)
  })

  describe('GET /api/admin/overview', () => {
    it('should return dashboard overview for admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.product.findMany.mockResolvedValue([])
      mockPrisma.user.count.mockResolvedValue(10)
      mockPrisma.order.findMany.mockResolvedValue([
        { id: 'order-1', total: 100, status: 'pending', createdAt: new Date(), items: [] }
      ])
      mockPrisma.analytics.findMany.mockResolvedValue([])
      mockPrisma.portfolio.count.mockResolvedValue(5)
      mockPrisma.project.count.mockResolvedValue(3)

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
        isActive: true,
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
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'user@test.com', fullName: 'User', role: 'user', isActive: true, createdAt: new Date() }
      ])

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
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        isActive: true,
      })
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        isActive: false,
      })

      const response = await request(app)
        .patch('/api/admin/users/user-1/suspend')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
      })
    })

    it('should activate user as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        isActive: false,
      })
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        isActive: true,
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
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.settings.findFirst.mockResolvedValue({
        id: 'settings-1',
        siteName: 'HOK',
        currency: 'KES',
      })
      mockPrisma.settings.update.mockResolvedValue({
        id: 'settings-1',
        siteName: 'Updated HOK',
        currency: 'KES',
      })

      const response = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          siteName: 'Updated HOK',
          currency: 'KES',
        })

      expect(response.status).toBe(200)
      expect(response.body.data.siteName).toBe('Updated HOK')
    })

    it('should create settings if none exist', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.settings.findFirst.mockResolvedValue(null)
      mockPrisma.settings.create.mockResolvedValue({
        id: 'settings-1',
        siteName: 'HOK',
        currency: 'USD',
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
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'pending',
      })
      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: 'shipped',
      })

      const response = await request(app)
        .patch('/api/admin/orders/order-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'shipped' })

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('shipped')
    })

    it('should update order status with any string as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'pending',
      })
      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: 'invalid-status',
      })

      const response = await request(app)
        .patch('/api/admin/orders/order-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid-status' })

      expect(response.status).toBe(200)
    })
  })
})
