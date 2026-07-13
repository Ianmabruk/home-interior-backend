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

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.NODE_ENV = 'test'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'
process.env.CLIENT_URL = 'http://localhost:5173'

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

  describe('GET /api/content/projects', () => {
    it('should list published projects', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          title: 'Project 1',
          description: 'Description',
          category: 'Residential',
          isPublished: true,
        }
      ])

      const response = await request(app)
        .get('/api/content/projects')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
    })
  })

  describe('POST /api/content/projects', () => {
    it('should create project as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.project.create.mockResolvedValue({
        id: 'proj-1',
        title: 'New Project',
        description: 'Description',
        category: 'Residential',
        isPublished: true,
      })

      const response = await request(app)
        .post('/api/content/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Project',
          description: 'Description',
          category: 'Residential',
          isPublished: true,
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })

    it('should reject project creation without auth', async () => {
      const response = await request(app)
        .post('/api/content/projects')
        .send({
          title: 'New Project',
        })

      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/content/projects/:id', () => {
    it('should update project as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        title: 'Old Title',
      })
      mockPrisma.project.update.mockResolvedValue({
        id: 'proj-1',
        title: 'New Title',
      })

      const response = await request(app)
        .patch('/api/content/projects/proj-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Title',
        })

      expect(response.status).toBe(200)
      expect(response.body.data.title).toBe('New Title')
    })

    it('should return 404 for non-existent project', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.project.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/content/projects/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Title',
        })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/content/projects/:id', () => {
    it('should delete project as admin', async () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
      }
      const token = generateToken(admin)

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        title: 'Test Project',
      })
      mockPrisma.project.delete.mockResolvedValue({
        id: 'proj-1',
      })

      const response = await request(app)
        .delete('/api/content/projects/proj-1')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
    })
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
    })
  })

  describe('POST /api/content/portfolio', () => {
    const admin = { id: 'admin-1', email: 'admin@test.com', role: 'admin', isActive: true }
    const token = generateToken(admin)

    it('should create portfolio as admin (full payload)', async () => {
      mockPrisma.portfolio.create.mockResolvedValue({
        id: 'port-1',
        title: 'New Portfolio',
        description: 'Desc',
        category: 'Residential',
        imageUrl: 'https://test.cloudinary.com/image.jpg',
        imagePublicId: 'test-public-id',
        order: 1,
        isPublished: true,
        mediaSettings: { position: 'center' },
      })

      const response = await request(app)
        .post('/api/content/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Portfolio',
          description: 'Desc',
          category: 'Residential',
          order: 1,
          isPublished: true,
          mediaSettings: { position: 'center' },
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.description).toBe('Desc')
    })

    it('should create portfolio with description when schema supports it', async () => {
      mockPrisma.portfolio.create.mockResolvedValue({
        id: 'port-2',
        title: 'Recovered Portfolio',
        description: 'Desc',
        category: 'Residential',
        imageUrl: 'https://test.cloudinary.com/image.jpg',
        isPublished: true,
      })

      const response = await request(app)
        .post('/api/content/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Recovered Portfolio',
          description: 'Desc',
          category: 'Residential',
          isPublished: true,
        })

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
        .send({
          story: 'Our story',
          mission: 'Mission',
          vision: 'Vision',
        })

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
