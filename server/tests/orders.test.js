import { jest } from '@jest/globals'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createMockPrisma, resetMockPrisma } from './helpers.js'

const mockPrisma = createMockPrisma()

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: mockPrisma,
  executeWithRetry: jest.fn((fn) => fn()),
  checkDatabaseHealth: jest.fn().mockResolvedValue({ database: 'connected', prisma: 'connected' }),
}))

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.NODE_ENV = 'test'
process.env.CLIENT_URL = 'http://localhost:5173'

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
    jest.clearAllMocks()
    resetMockPrisma(mockPrisma)
  })

  describe('POST /api/orders', () => {
    it('should create order with valid items', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        isActive: true,
        fullName: 'Test User',
      }
      const token = generateToken(user)

      mockPrisma.user.findUnique.mockResolvedValue(user)
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'prod-1234567890', name: 'Product 1', price: 100, stock: 10, images: [{ url: 'test.jpg' }], colorVariants: [] }
      ])
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          order: { create: jest.fn().mockResolvedValue({ id: 'order-1', total: 100, items: [] }) },
          product: { update: jest.fn().mockResolvedValue({ id: 'prod-1234567890', stock: 9 }) },
        }
        return callback(tx)
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
        isActive: true,
        fullName: 'Test User',
      }
      const token = generateToken(user)

      mockPrisma.user.findUnique.mockResolvedValue(user)
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'prod-1234567890', name: 'Product 1', price: 100, stock: 1, images: [], colorVariants: [] }
      ])

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
        isActive: true,
        fullName: 'Test User',
      }
      const token = generateToken(user)

      mockPrisma.user.findUnique.mockResolvedValue(user)
      mockPrisma.product.findMany.mockResolvedValue([])

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
        isActive: true,
      }
      const token = generateToken(user)

      mockPrisma.user.findUnique.mockResolvedValue(user)
      mockPrisma.order.findMany.mockResolvedValue([
        { id: 'order-1', total: 100, status: 'pending', items: [] }
      ])

      const response = await request(app)
        .get('/api/orders/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
    })
  })
})
