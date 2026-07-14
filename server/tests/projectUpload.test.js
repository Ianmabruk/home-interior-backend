import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import fs from 'fs/promises'
import path from 'path'
import { createMockPrisma, resetMockPrisma } from './helpers.js'

const mockPrisma = createMockPrisma()
const PROJECTS_TEMP_PATH = path.join(process.cwd(), 'temp', 'projects.json')

jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: mockPrisma,
}))

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  verifyCloudinaryConfig: jest.fn().mockResolvedValue(true),
  uploadToCloudinary: jest.fn().mockResolvedValue({
    secure_url: 'https://test.cloudinary.com/image.jpg',
    public_id: 'test-public-id',
  }),
  default: {},
}))

// Mock Cloudinary upload so no real network call happens.
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

const generateToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' },
  )

const admin = { id: 'admin-1', email: 'admin@test.com', role: 'admin', isActive: true }
const token = generateToken(admin)

let app

describe('Admin Project Dashboard — video upload', () => {
  beforeAll(async () => {
    const appModule = await import('../src/app.js')
    app = appModule.app
  })

  beforeEach(() => {
    jest.clearAllMocks()
    resetMockPrisma(mockPrisma)
    fs.writeFile(PROJECTS_TEMP_PATH, JSON.stringify({ projects: [] }), 'utf-8').catch(() => {})
  })

  it('creates a project with an uploaded video and defaults tags/services to []', async () => {
    const response = await request(app)
      .post('/api/content/projects')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Loft Renovation')
      .field('description', 'A full loft transformation')
      .field('category', 'Renovation')
      .field('order', '0')
      .field('resourceType', 'video')
      .field('mediaSettings', JSON.stringify({ position: 'center', zoom: 100, fit: 'cover' }))
      .attach('media', Buffer.from('fake-video-bytes'), {
        filename: 'showcase.mp4',
        contentType: 'video/mp4',
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)

    // The upload must have reached Cloudinary (video branch).
    expect(mockUploadVideo).toHaveBeenCalledTimes(1)
    expect(mockUploadImage).not.toHaveBeenCalled()

    // The response must contain the video URL + safe defaults.
    expect(response.body.project.videoUrl).toBe('https://test.cloudinary.com/project-video.mp4')
    expect(response.body.project.videoPublicId).toBe('test-video-id')
    expect(Array.isArray(response.body.project.media)).toBe(true)
    expect(response.body.project.media[0]).toMatchObject({
      type: 'video',
      url: 'https://test.cloudinary.com/project-video.mp4',
      publicId: 'test-video-id',
    })
    expect(response.body.project.isPublished).toBe(true)
  })

  it('creates a project without a title', async () => {
    const response = await request(app)
      .post('/api/content/projects')
      .set('Authorization', `Bearer ${token}`)
      .field('order', '1')
      .field('resourceType', 'video')
      .field('mediaSettings', JSON.stringify({ position: 'center', zoom: 100, fit: 'cover' }))
      .attach('media', Buffer.from('fake-video-bytes'), {
        filename: 'showcase.mp4',
        contentType: 'video/mp4',
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.project.videoUrl).toBe('https://test.cloudinary.com/project-video.mp4')
    expect(response.body.project.isPublished).toBe(true)
  })

  it('returns 401 when not authenticated', async () => {
    const response = await request(app)
      .post('/api/content/projects')
      .field('title', 'No Auth Project')
      .attach('media', Buffer.from('x'), { filename: 'v.mp4', contentType: 'video/mp4' })

    expect(response.status).toBe(401)
  })

  it('returns 403 when a non-admin tries to upload', async () => {
    const userToken = generateToken({
      id: 'user-1',
      email: 'user@test.com',
      role: 'user',
    })
    const response = await request(app)
      .post('/api/content/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .field('title', 'User Project')
      .attach('media', Buffer.from('x'), { filename: 'v.mp4', contentType: 'video/mp4' })

    expect(response.status).toBe(403)
  })
})
