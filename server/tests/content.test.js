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
  public_id: 'test-image-id',
})
const mockUploadVideo = jest.fn().mockResolvedValue({
  secure_url: 'https://test.cloudinary.com/project-video.mp4',
  public_id: 'test-video-id',
})
const mockDeleteMedia = jest.fn().mockResolvedValue({ result: 'ok' })

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
process.env.CLIENT_URL = 'http://localhost:5173'

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

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
    jest.clearAllMocks()
    resetMockPrisma(mockPrisma)
  })

  describe('GET /api/content/portfolio', () => {
    it('should list published portfolio items', async () => {
      mockPrisma.portfolio.findMany.mockResolvedValue([
        {
          id: 'port-1',
          title: 'Portfolio 1',
          category: 'Residential',
          isPublished: true,
        }
      ])

      const response = await request(app)
        .get('/api/content/portfolio')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /api/content/portfolio', () => {
    const admin = { id: 'admin-1', email: 'admin@test.com', role: 'admin', isActive: true }
    const token = generateToken(admin)

    it('should create portfolio as admin with image upload', async () => {
      mockPrisma.portfolio.create.mockResolvedValue({
        id: 'port-1',
        title: 'New Portfolio',
        description: 'Desc',
        imageUrl: 'https://test.cloudinary.com/image.jpg',
        cloudinaryId: 'test-public-id',
        displayOrder: 1,
        featured: false,
        galleryImages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const response = await request(app)
        .post('/api/content/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'New Portfolio')
        .field('description', 'Desc')
        .field('displayOrder', '1')
        .attach('media', PNG_1x1, 'room.png')

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.description).toBe('Desc')

      // image uploaded through shared service
      expect(mockUploadImage).toHaveBeenCalledTimes(1)
    })

    it('should create portfolio with description when schema supports it', async () => {
      mockPrisma.portfolio.create.mockResolvedValue({
        id: 'port-2',
        title: 'Recovered Portfolio',
        description: 'Desc',
        imageUrl: 'https://test.cloudinary.com/image.jpg',
        cloudinaryId: 'test-image-id',
        displayOrder: 0,
        featured: false,
        mediaUrls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const response = await request(app)
        .post('/api/content/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Recovered Portfolio')
        .field('description', 'Desc')
        .attach('media', PNG_1x1, 'room.png')

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(mockPrisma.portfolio.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.portfolio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ description: 'Desc' }),
        }),
      )
    })
  })

  describe('PUT /api/content/about', () => {
    it('should update about content as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.about.findFirst.mockResolvedValue(null)
      mockPrisma.about.create.mockResolvedValue({
        id: 'about-1',
        story: 'Our story',
      })

      const response = await request(app)
        .put('/api/content/about')
        .set('Authorization', `Bearer ${token}`)
        .field('story', 'Our story')
        .field('mission', 'Mission')
        .field('vision', 'Vision')
        .attach('media', PNG_1x1, 'about.png')

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/content/virtual-design', () => {
    it('should list published virtual designs', async () => {
      mockPrisma.virtualDesign.findMany.mockResolvedValue([
        {
          id: 'vd-1',
          title: 'Virtual Design 1',
          isPublished: true,
        }
      ])

      const response = await request(app)
        .get('/api/content/virtual-design')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
