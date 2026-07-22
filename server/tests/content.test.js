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
  secure_url: 'https://test.cloudinary.com/image.jpg',
  public_id: 'test-public-id',
})
const mockDeleteMedia = jest.fn().mockResolvedValue({ result: 'ok' })

jest.unstable_mockModule('../src/services/uploadService.js', () => ({
  uploadImage: mockUploadImage,
  uploadVideo: mockUploadImage,
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

describe('Content Management', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    resetMockSupabaseAfterEach()
  })

  describe('GET /api/content/portfolio', () => {
    it('should list published portfolio items', async () => {
      builder.setResolveWith({
        data: [
          { id: 'port-1', title: 'Portfolio 1', category: 'Residential', is_published: true, image_url: 'https://test.cloudinary.com/image.jpg', display_order: 0, created_at: new Date().toISOString() }
        ],
        error: null,
      })

      const response = await request(app)
        .get('/api/content/portfolio')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /api/content/portfolio', () => {
    it('should create portfolio as admin with image upload', async () => {
      builder.single.mockResolvedValueOnce({
        data: { id: 'port-1', title: 'Living Room', description: 'Desc', image_url: 'https://test.cloudinary.com/image.jpg', cloudinary_id: 'test-public-id', display_order: 1, featured: false, created_at: new Date().toISOString() },
        error: null,
      })

      const response = await request(app)
        .post('/api/content/portfolio')
        .set('Authorization', `Bearer ${generateToken({ id: 'admin-1', email: 'admin@test.com', role: 'admin', is_active: true })}`)
        .field('title', 'Living Room')
        .field('category', 'Residential')
        .field('displayOrder', '1')
        .attach('media', Buffer.from('fake-image-bytes'), { filename: 'room.png', contentType: 'image/png' })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.description).toBe('Desc')
    })

    it('should create portfolio with description when schema supports it', async () => {
      builder.single.mockResolvedValueOnce({
        data: { id: 'port-2', title: 'Recovered Portfolio', description: 'Desc', image_url: 'https://test.cloudinary.com/image.jpg', cloudinary_id: 'test-image-id', display_order: 0, featured: false, created_at: new Date().toISOString() },
        error: null,
      })

      const response = await request(app)
        .post('/api/content/portfolio')
        .set('Authorization', `Bearer ${generateToken({ id: 'admin-1', email: 'admin@test.com', role: 'admin', is_active: true })}`)
        .field('title', 'Recovered Portfolio')
        .field('description', 'Desc')
        .attach('media', Buffer.from('fake-image-bytes'), { filename: 'room.png', contentType: 'image/png' })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })
  })

  describe('PUT /api/content/about', () => {
    it('should update about content as admin', async () => {
      builder.setResolveWith({ data: [], error: null })
      builder.single.mockResolvedValueOnce({
        data: { id: 'about-1', story: 'Our story', about_image_url: 'https://test.cloudinary.com/a.jpg' },
        error: null,
      })

      const response = await request(app)
        .put('/api/content/about')
        .set('Authorization', `Bearer ${generateToken({ id: 'admin-1', email: 'admin@test.com', role: 'admin', is_active: true })}`)
        .field('story', 'Our story')
        .field('mission', 'Our mission')
        .field('vision', 'Our vision')
        .field('companyDescription', 'We design interiors')
        .field('location', 'Nairobi')
        .field('contactEmail', 'info@hok.com')
        .attach('media', Buffer.from('fake-image-bytes'), { filename: 'about.png', contentType: 'image/png' })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/content/virtual-design', () => {
    it('should list published virtual designs', async () => {
      builder.setResolveWith({
        data: [
          { id: 'vd-1', title: 'Virtual Design 1', is_published: true }
        ],
        error: null,
      })

      const response = await request(app)
        .get('/api/content/virtual-design')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
