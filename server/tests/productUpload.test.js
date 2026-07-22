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

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  verifyCloudinaryConfig: jest.fn().mockResolvedValue(true),
  uploadToCloudinary: jest.fn().mockResolvedValue({
    url: 'https://test.cloudinary.com/image.jpg',
    publicId: 'test-public-id',
  }),
  default: {},
}))

const mockUploadImage = jest.fn().mockResolvedValue({
  secure_url: 'https://test.cloudinary.com/product-image.jpg',
  public_id: 'product-image-id',
})
const mockUploadVideo = jest.fn().mockResolvedValue({
  secure_url: 'https://test.cloudinary.com/product-video.mp4',
  public_id: 'product-video-id',
  resource_type: 'video',
})
const mockDeleteMedia = jest.fn().mockResolvedValue({ result: 'ok' })

jest.unstable_mockModule('../src/services/uploadService.js', () => ({
  uploadImage: mockUploadImage,
  uploadVideo: mockUploadVideo,
  deleteMedia: mockDeleteMedia,
  uploadToCloudinary: mockUploadImage,
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

const generateToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  )

const admin = { id: 'admin-1', email: 'admin@test.com', role: 'admin', is_active: true }
const token = generateToken(admin)

let app

describe('Admin Product Dashboard — image upload', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    jest.clearAllMocks()
    resetMockSupabase(builder)
    realSupabase.from = jest.fn(() => builder)
    realSupabase.rpc = jest.fn(() => builder)
  })

  it('creates a product with an uploaded image and defaults tags to []', async () => {
    builder.single.mockResolvedValueOnce({
      data: { id: 'prod-1', name: 'Accent Chair', description: 'A comfortable accent chair', price: 199, category: 'Frames', stock: 5, images: [{ url: 'https://test.cloudinary.com/product-image.jpg', publicId: 'product-image-id' }], is_published: true, created_at: new Date().toISOString() },
      error: null,
    })

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Accent Chair')
      .field('description', 'A comfortable accent chair for the living room')
      .field('price', '199')
      .field('category', 'Frames')
      .field('stock', '5')
      .attach('images', Buffer.from('fake-image-bytes'), {
        filename: 'chair.jpg',
        contentType: 'image/jpeg',
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)

    expect(mockUploadImage).toHaveBeenCalledTimes(1)
    expect(mockUploadVideo).not.toHaveBeenCalled()

    expect(Array.isArray(response.body.data.images)).toBe(true)
    expect(response.body.data.images[0]).toMatchObject({
      url: 'https://test.cloudinary.com/product-image.jpg',
      publicId: 'product-image-id',
    })
    expect(response.body.data.is_published).toBe(true)
  })

  it('lists products for the admin dashboard without error', async () => {
    builder.setResolveWith({
      data: [
        {
          id: 'prod-1',
          name: 'Accent Chair',
          price: 199,
          category: 'Living Room',
          images: [{ url: 'https://test.cloudinary.com/product-image.jpg', publicId: 'x' }],
          stock: 5,
          is_published: true,
        },
      ],
      count: 1,
      error: null,
    })

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
      .attach('images', Buffer.from('x'), { filename: 'chair.jpg', contentType: 'image/jpeg' })

    expect(response.status).toBe(403)
  })
})
