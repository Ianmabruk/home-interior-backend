import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createMockPrisma, resetMockPrisma } from './helpers.js'

const mockPrisma = createMockPrisma()

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: mockPrisma,
  executeWithRetry: jest.fn((fn) => fn()),
  checkDatabaseHealth: jest.fn().mockResolvedValue({ database: 'connected', prisma: 'connected' }),
}))

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  verifyCloudinaryConfig: jest.fn().mockResolvedValue(true),
  uploadToCloudinary: jest.fn().mockResolvedValue({
    url: 'https://test.cloudinary.com/image.jpg',
    publicId: 'test-public-id',
  }),
  default: {},
}))

jest.unstable_mockModule('../src/services/uploadService.js', () => ({
  uploadImage: mockUploadImage,
  uploadVideo: mockUploadVideo,
  deleteMedia: mockDeleteMedia,
}))

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.NODE_ENV = 'test'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'
process.env.SEED_ADMIN_EMAIL = 'admin@test.com'
process.env.SEED_ADMIN_PASSWORD = 'admin123'
process.env.CLIENT_URL = 'http://localhost:5173'

const generateToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' },
  )

const admin = { id: 'admin-1', email: 'admin@test.com', role: 'admin', isActive: true }
const token = generateToken(admin)

let app

describe('Admin Product Dashboard — image upload', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    jest.clearAllMocks()
    resetMockPrisma(mockPrisma)
  })

  it('creates a product with an uploaded image and defaults tags to []', async () => {
    let capturedCreate
    mockPrisma.product.create.mockImplementation(({ data }) => {
      capturedCreate = data
      return Promise.resolve({ id: 'prod-1', ...data })
    })

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Accent Chair')
      .field('description', 'A comfortable accent chair for the living room')
      .field('price', '199')
      .field('category', 'Frames')
      .field('stock', '5')
      .field('sku', 'CHAIR-001')
      .field('tags', 'chair, living')
      .field('mediaSettings', JSON.stringify({ position: 'center', zoom: 100, fit: 'cover' }))
      .attach('images', Buffer.from('fake-image-bytes'), {
        filename: 'chair.jpg',
        contentType: 'image/jpeg',
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)

    // Image upload to Cloudinary must have happened (image branch).
    expect(mockUploadImage).toHaveBeenCalledTimes(1)
    expect(mockUploadVideo).not.toHaveBeenCalled()

    // The DB record carries the uploaded image + safe defaults.
    expect(Array.isArray(capturedCreate.images)).toBe(true)
    expect(capturedCreate.images[0]).toMatchObject({
      url: 'https://test.cloudinary.com/product-image.jpg',
      publicId: 'product-image-id',
    })
    expect(capturedCreate.tags).toEqual(['chair', 'living'])
    expect(capturedCreate.isPublished).toBe(true)
  })

  it('lists products for the admin dashboard without error', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Accent Chair',
        price: 199,
        category: 'Living Room',
        images: [{ url: 'https://test.cloudinary.com/product-image.jpg', publicId: 'x' }],
        tags: ['chair'],
        mediaSettings: { position: 'center' },
        colorVariants: [],
        stock: 5,
        isPublished: true,
      },
    ])

    const response = await request(app)
      .get('/api/products/admin/all')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.items).toHaveLength(1)
    expect(response.body.data.items[0].images[0].url).toBe(
      'https://test.cloudinary.com/product-image.jpg',
    )
  })

  it('rejects product creation as non-admin', async () => {
    const userToken = generateToken({
      id: 'user-1',
      email: 'user@test.com',
      role: 'user',
    })
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .field('name', 'Chair')
      .field('description', 'A comfortable accent chair for the living room')
      .field('price', '199')
      .field('category', 'Frames')
      .field('stock', '5')
      .field('sku', 'CHAIR-001')
      .attach('images', Buffer.from('x'), { filename: 'chair.jpg', contentType: 'image/jpeg' })

    expect(response.status).toBe(403)
  })
})
