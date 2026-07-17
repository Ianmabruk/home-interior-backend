import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const mockUploadVideo = jest.fn().mockResolvedValue({
  secure_url: 'https://test.cloudinary.com/project-video.mp4',
  public_id: 'test-video-id',
  thumbnail_url: 'https://test.cloudinary.com/project-video-thumb.jpg',
})
const mockUploadImage = jest.fn().mockResolvedValue({
  secure_url: 'https://test.cloudinary.com/image.jpg',
  public_id: 'test-image-id',
})
const mockDeleteMedia = jest.fn().mockResolvedValue({ result: 'ok' })

jest.unstable_mockModule('../src/services/uploadService.js', () => ({
  uploadImage: mockUploadImage,
  uploadVideo: mockUploadVideo,
  deleteMedia: mockDeleteMedia,
  uploadToCloudinary: jest.fn(),
}))

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  verifyCloudinaryConfig: jest.fn().mockResolvedValue(true),
  default: {},
}))

const mockProjectV2 = {
  findMany: jest.fn().mockResolvedValue([]),
  findUnique: jest.fn().mockResolvedValue({
    id: 'proj-1',
    videoUrl: 'https://test.cloudinary.com/project-video.mp4',
    videoPublicId: 'test-video-id',
    thumbnailUrl: 'https://test.cloudinary.com/project-video-thumb.jpg',
    order: 0,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  create: jest.fn().mockResolvedValue({
    id: 'proj-new',
    videoUrl: 'https://test.cloudinary.com/project-video.mp4',
    videoPublicId: 'test-video-id',
    thumbnailUrl: 'https://test.cloudinary.com/project-video-thumb.jpg',
    order: 0,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  update: jest.fn().mockResolvedValue({
    id: 'proj-1',
    videoUrl: 'https://test.cloudinary.com/project-video.mp4',
    videoPublicId: 'test-video-id',
    thumbnailUrl: 'https://test.cloudinary.com/project-video-thumb.jpg',
    order: 0,
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  delete: jest.fn().mockResolvedValue({}),
  $transaction: jest.fn((fn) => fn([
    { id: 'proj-1', update: () => ({ id: 'proj-1', order: 0 }) },
    { id: 'proj-2', update: () => ({ id: 'proj-2', order: 1 }) },
  ])),
}

jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: {
    projectV2: mockProjectV2,
    $transaction: jest.fn(),
  },
  executeWithRetry: jest.fn((fn) => fn()),
  checkDatabaseHealth: jest.fn().mockResolvedValue({ database: 'connected', prisma: 'connected' }),
}))

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.NODE_ENV = 'test'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'
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

describe('Project V2 API', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/project-v2/upload', () => {
    it('returns 201 when uploading a valid mp4', async () => {
      const response = await request(app)
        .post('/api/project-v2/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('video', Buffer.from('fake-video-bytes'), {
          filename: 'showcase.mp4',
          contentType: 'video/mp4',
        })
        .field('order', '0')

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.videoUrl).toBe('https://test.cloudinary.com/project-video.mp4')
      expect(response.body.data.videoPublicId).toBe('test-video-id')
      expect(response.body.data.order).toBe(0)
      expect(response.body.data.isPublished).toBe(true)
      expect(mockUploadVideo).toHaveBeenCalledTimes(1)
    })

    it('returns 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/project-v2/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('order', '0')

      expect(response.status).toBe(400)
    })

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/project-v2/upload')
        .attach('video', Buffer.from('x'), { filename: 'v.mp4', contentType: 'video/mp4' })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/project-v2', () => {
    it('returns an empty array when no projects exist', async () => {
      const response = await request(app).get('/api/project-v2')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(0)
    })
  })

  describe('DELETE /api/project-v2/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const response = await request(app).delete('/api/project-v2/some-id')

      expect(response.status).toBe(401)
    })
  })
})