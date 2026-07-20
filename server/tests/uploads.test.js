import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createMockPrisma, resetMockPrisma } from './helpers.js'

// End-to-end verification of the upload → store → save → return → serve
// pipeline for the modules reported as broken (Portfolio, About, Products)
// measured against the working Projects module, plus the auth/refresh,
// health-check, CORS and validation fixes.

const mockPrisma = createMockPrisma()

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: mockPrisma,
  executeWithRetry: jest.fn((fn) => fn()),
  checkDatabaseHealth: jest.fn().mockResolvedValue({ database: 'connected', prisma: 'connected' }),
}))

// Mock the centralized upload service so we exercise the real controller
// wiring (field parsing, DB payload construction, response shape) without
// hitting Cloudinary over the network. Every module must route through here.
const uploadImage = jest.fn().mockResolvedValue({
  secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
  public_id: 'hok/test/test-image',
})
const uploadVideo = jest.fn().mockResolvedValue({
  secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/test.mp4',
  public_id: 'hok/test/test-video',
})
const deleteMedia = jest.fn().mockResolvedValue({ result: 'ok' })

jest.unstable_mockModule('../src/services/uploadService.js', () => ({
  uploadImage,
  uploadVideo,
  deleteMedia,
  uploadToCloudinary: uploadImage,
}))

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  verifyCloudinaryConfig: jest.fn().mockResolvedValue(true),
  default: {},
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

const adminToken = () =>
  jwt.sign(
    { userId: 'admin-1', email: 'admin@test.com', role: 'admin' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' },
  )

let app

beforeAll(async () => {
  const appModule = await import('../src/app.js')
  app = appModule.app
})

beforeEach(() => {
  jest.clearAllMocks()
  resetMockPrisma(mockPrisma)
  uploadImage.mockResolvedValue({
    secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
    public_id: 'hok/test/test-image',
  })
  uploadVideo.mockResolvedValue({
    secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/test.mp4',
    public_id: 'hok/test/test-video',
  })
})

describe('PORTFOLIO upload pipeline', () => {
  it('uploads image → stores URL+publicId → returns saved record', async () => {
    mockPrisma.portfolio.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'port-1', createdAt: new Date().toISOString(), ...data }),
    )

    const res = await request(app)
      .post('/api/content/portfolio')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('title', 'Living Room')
      .field('category', 'Residential')
      .field('order', '1')
      .field('mediaSettings', JSON.stringify({ position: 'center', zoom: 100, fit: 'cover' }))
      .attach('media', PNG_1x1, 'room.png')

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    // Image was pushed to storage exactly once through the shared service.
    expect(uploadImage).toHaveBeenCalledTimes(1)
    // URL + publicId persisted to the DB.
    const saved = mockPrisma.portfolio.create.mock.calls[0][0].data
    expect(saved.imageUrl).toContain('res.cloudinary.com')
    expect(saved.cloudinaryId).toBe('hok/test/test-image')
    // API returns the saved record with a public URL and _id alias.
    expect(res.body.data.imageUrl).toContain('res.cloudinary.com')
    expect(res.body.data._id).toBe('port-1')
  })

  it('lists portfolio items for the public site', async () => {
    mockPrisma.portfolio.findMany.mockResolvedValue([
      { id: 'port-1', title: 'A', category: 'X', imageUrl: 'https://res.cloudinary.com/a.jpg', order: 0, isPublished: true },
    ])
    const res = await request(app).get('/api/content/portfolio')
    expect(res.status).toBe(200)
    expect(res.body.data[0].imageUrl).toContain('res.cloudinary.com')
  })
})

describe('ABOUT upload pipeline', () => {
  it('uploads image + saves content → returns record', async () => {
    mockPrisma.about.findFirst.mockResolvedValue(null)
    mockPrisma.about.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'about-1', ...data }),
    )

    const res = await request(app)
      .put('/api/content/about')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('story', 'Our story')
      .field('mission', 'Our mission')
      .field('vision', 'Our vision')
      .field('companyDescription', 'We design interiors')
      .field('location', 'Nairobi')
      .field('contactEmail', 'info@hok.com')
      .attach('media', PNG_1x1, 'about.png')

    expect(res.status).toBe(201)
    expect(uploadImage).toHaveBeenCalledTimes(1)
    const saved = mockPrisma.about.create.mock.calls[0][0].data
    expect(saved.aboutImageUrl).toContain('res.cloudinary.com')
    expect(saved.aboutImagePublicId).toBe('hok/test/test-image')
    expect(saved.story).toBe('Our story')
    expect(res.body.data.aboutImageUrl).toContain('res.cloudinary.com')
  })
})

describe('PRODUCTS upload pipeline', () => {
  it('uploads image → saves product with images[] → returns record', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ email: 'admin@test.com', role: 'admin' })
    mockPrisma.product.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'prod-1', ...data }),
    )

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'Velvet Sofa')
      .field('description', 'A very comfortable velvet sofa for living rooms.')
      .field('price', '999.99')
      .field('category', 'Frames')
      .field('stock', '10')
      .field('sku', 'SOFA-001')
      .attach('images', PNG_1x1, 'sofa.png')

    expect(res.status).toBe(201)
    expect(uploadImage).toHaveBeenCalledTimes(1)
    const saved = mockPrisma.product.create.mock.calls[0][0].data
    expect(saved.images[0].url).toContain('res.cloudinary.com')
    expect(saved.images[0].publicId).toBe('hok/test/test-image')
    expect(res.body.data.images[0].url).toContain('res.cloudinary.com')
  })

  it('persists isPublished=false / isFeatured=false from form-data (no z.coerce bug)', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.product.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'prod-2', ...data }),
    )
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'Draft Lamp')
      .field('description', 'A lamp kept as an unpublished draft for now.')
      .field('price', '50')
      .field('category', 'Mirrors')
      .field('stock', '3')
      .field('sku', 'LAMP-DRAFT')
      .field('isPublished', 'false')
      .field('isFeatured', 'false')
      .attach('images', PNG_1x1, 'lamp.png')

    expect(res.status).toBe(201)
    const saved = mockPrisma.product.create.mock.calls[0][0].data
    // The strings 'false' must persist as boolean false, not coerce to true.
    expect(saved.isPublished).toBe(false)
    expect(saved.isFeatured).toBe(false)
  })

  it('defaults isPublished=true when the field is omitted', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.product.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'prod-3', ...data }),
    )
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'Auto Sofa')
      .field('description', 'A published-by-default sofa for the shop page.')
      .field('price', '120')
      .field('category', 'Frames')
      .field('stock', '5')
      .field('sku', 'SOFA-AUTO')
      .attach('images', PNG_1x1, 'auto.png')

    expect(res.status).toBe(201)
    expect(mockPrisma.product.create.mock.calls[0][0].data.isPublished).toBe(true)
  })

  it('public GET /products only returns published products (shop page trace)', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 'prod-1', name: 'Sofa', category: 'Living Room', price: 100, images: [{ url: 'https://res.cloudinary.com/s.jpg', publicId: 'x' }], isPublished: true },
    ])
    mockPrisma.product.count.mockResolvedValue(1)
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(mockPrisma.product.findMany.mock.calls[0][0].where).toEqual({ isPublished: true })
    expect(res.body.data.items[0].images[0].url).toContain('res.cloudinary.com')
  })

  it('returns 400 with a real field message on invalid product (zod v4 .issues)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'X') // too short
      .field('description', 'short') // too short
      .field('price', '-5') // negative
      .field('category', 'Frames')
      .field('stock', '10')
      .field('sku', 'SKU1')
      .attach('images', PNG_1x1, 'x.png')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    // The message is no longer the generic fallback — it names the field(s).
    expect(res.body.message).not.toBe('Validation error')
    expect(res.body.message.length).toBeGreaterThan(0)
    expect(Array.isArray(res.body.details)).toBe(true)
  })
})

describe('HOMEPAGE feed aggregates all published content', () => {
  it('returns portfolio, virtualInteriorDesign, about and testimonials together', async () => {
    mockPrisma.portfolio.findMany.mockResolvedValue([
      { id: 'f1', title: 'F', category: 'c', imageUrl: 'https://res.cloudinary.com/f.jpg', mediaSettings: null, order: 0, createdAt: new Date() },
    ])
    mockPrisma.virtualDesign.findMany.mockResolvedValue([
      { id: 'v1', title: 'V', description: 'd', category: 'c', imageUrl: 'https://res.cloudinary.com/v.jpg', mediaSettings: null, order: 0, createdAt: new Date() },
    ])
    mockPrisma.about.findFirst.mockResolvedValue({ id: 'a1', aboutImageUrl: 'https://res.cloudinary.com/a.jpg', story: 's', mission: 'm', vision: 'v', mediaSettings: null })
    mockPrisma.testimonial.findMany.mockResolvedValue([
      { id: 't1', name: 'Test', role: 'Client', content: 'Great!', avatarUrl: 'https://res.cloudinary.com/t.jpg', order: 0, displayOrder: 0, isActive: true, createdAt: new Date() },
    ])

    const res = await request(app).get('/api/content/homepage')
    expect(res.status).toBe(200)
    expect(res.body.data.portfolio[0].imageUrl).toContain('res.cloudinary.com')
    expect(res.body.data.about.aboutImageUrl).toContain('res.cloudinary.com')
    expect(res.body.data.virtualInteriorDesign.length).toBe(1)
    expect(res.body.data.testimonials.length).toBe(1)
  })
})

describe('AUTH /refresh robustness', () => {
  it('returns 401 (not 500 TypeError) when body is empty and no cookie', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Content-Type', 'application/json')
      .send('')
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/refresh token/i)
  })

  it('returns 401 (not 500) on an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'not-a-jwt' })
    expect(res.status).toBe(401)
  })
})

describe('HEALTH check reflects real DB state (prisma import fix)', () => {
  it('returns 200 + database:connected when the DB query succeeds', async () => {
    mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }])
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.database).toBe('connected')
  })
})

describe('CORS rejection returns a clean 403 (ApiError import fix)', () => {
  it('does not crash with a 500 ReferenceError for a disallowed origin', async () => {
    const res = await request(app)
      .get('/api/content/portfolio')
      .set('Origin', 'https://evil.example.com')
    // The request is blocked by CORS via ApiError(403); it must not be a 500.
    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})
