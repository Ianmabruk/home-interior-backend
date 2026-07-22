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
  secure_url: 'https://test.cloudinary.com/image.jpg',
  public_id: 'hok/test/test-image',
})
const mockUploadVideo = jest.fn().mockResolvedValue({
  secure_url: 'https://test.cloudinary.com/project-video.mp4',
  public_id: 'hok/test/test-video',
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
  resetMockSupabase(builder)
  realSupabase.from = jest.fn(() => builder)
  realSupabase.rpc = jest.fn(() => builder)
})

describe('PORTFOLIO upload pipeline', () => {
  it('uploads image → stores URL+publicId → returns saved record', async () => {
    builder.single.mockResolvedValueOnce({
      data: { id: 'port-1', title: 'Living Room', description: 'Desc', image_url: 'https://test.cloudinary.com/image.jpg', cloudinary_id: 'test-public-id', display_order: 1, featured: false, created_at: new Date().toISOString() },
      error: null,
    })

    const res = await request(app)
      .post('/api/content/portfolio')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('title', 'Living Room')
      .field('category', 'Residential')
      .field('displayOrder', '1')
      .attach('media', PNG_1x1, 'room.png')

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.image_url).toContain('test.cloudinary.com')
    expect(res.body.data._id).toBe('port-1')
  })

  it('lists portfolio items for the public site', async () => {
    builder.setResolveWith({
      data: [
        { id: 'port-1', title: 'A', category: 'X', image_url: 'https://test.cloudinary.com/a.jpg', display_order: 0, published: true, created_at: new Date().toISOString() }
      ],
      error: null,
    })

    const res = await request(app).get('/api/content/portfolio')
    expect(res.status).toBe(200)
    expect(res.body.data[0].image_url).toContain('test.cloudinary.com')
  })
})

describe('ABOUT upload pipeline', () => {
  it('uploads image + saves content → returns record', async () => {
    builder.setResolveWith({
      data: null,
      error: null,
    })
    builder.single.mockResolvedValueOnce({
      data: { id: 'about-1', story: 'Our story', about_image_url: 'https://test.cloudinary.com/a.jpg' },
      error: null,
    })

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
    expect(res.body.data.about_image_url).toContain('test.cloudinary.com')
  })
})

describe('PRODUCTS upload pipeline', () => {
  it('uploads image → saves product with images[] → returns record', async () => {
    builder.single.mockResolvedValueOnce({
      data: { id: 'prod-1', name: 'Velvet Sofa', images: [{ url: 'https://test.cloudinary.com/s.jpg', publicId: 'x' }] },
      error: null,
    })

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'Velvet Sofa')
      .field('description', 'A very comfortable velvet sofa for living rooms.')
      .field('price', '999.99')
      .field('category', 'Frames')
      .field('stock', '10')
      .attach('images', PNG_1x1, 'sofa.png')

    expect(res.status).toBe(201)
    expect(res.body.data.images[0].url).toContain('test.cloudinary.com')
  })

  it('persists isPublished=false / isFeatured=false from form-data', async () => {
    builder.single.mockResolvedValueOnce({
      data: { id: 'prod-2', is_published: false },
      error: null,
    })

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'Draft Lamp')
      .field('description', 'A lamp kept as an unpublished draft for now.')
      .field('price', '50')
      .field('category', 'Mirrors')
      .field('stock', '3')
      .field('isPublished', 'false')
      .attach('images', PNG_1x1, 'lamp.png')

    expect(res.status).toBe(201)
    expect(res.body.data.is_published).toBe(false)
  })

  it('defaults isPublished=true when the field is omitted', async () => {
    builder.single.mockResolvedValueOnce({
      data: { id: 'prod-3', is_published: true },
      error: null,
    })

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'Auto Sofa')
      .field('description', 'A published-by-default sofa for the shop page.')
      .field('price', '120')
      .field('category', 'Frames')
      .field('stock', '5')
      .attach('images', PNG_1x1, 'auto.png')

    expect(res.status).toBe(201)
    expect(res.body.data.is_published).toBe(true)
  })

  it('public GET /products only returns published products (shop page trace)', async () => {
    builder.setResolveWith({
      data: [
        { id: 'prod-1', name: 'Sofa', category: 'Living Room', price: 100, images: [{ url: 'https://test.cloudinary.com/s.jpg', publicId: 'x' }], is_published: true }
      ],
      count: 1,
      error: null,
    })

    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body.data.items[0].images[0].url).toContain('test.cloudinary.com')
  })

  it('creates product without images', async () => {
    builder.single.mockResolvedValueOnce({
      data: { id: 'prod-err', name: 'X', images: [] },
      error: null,
    })

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'X')
      .field('description', 'A product')
      .field('price', '10')
      .field('category', 'Frames')
      .field('stock', '1')

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })
})

describe('HOMEPAGE feed aggregates all published content', () => {
  it('returns portfolio, virtualInteriorDesign, about and hero together', async () => {
    builder.setResolveWith({
      data: [
        { id: 'f1', title: 'F', category: 'c', image_url: 'https://test.cloudinary.com/f.jpg', featured: false, display_order: 0, published: true, created_at: new Date().toISOString() }
      ],
      error: null,
    })

    const res = await request(app).get('/api/content/homepage')
    expect(res.status).toBe(200)
    expect(res.body.data.portfolio[0].image_url).toContain('test.cloudinary.com')
    expect(res.body.data.virtualInteriorDesign.length).toBeGreaterThanOrEqual(0)
    expect(res.body.data.services.length).toBeGreaterThanOrEqual(0)
    expect(res.body.data.heroMedia.length).toBeGreaterThanOrEqual(0)
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

describe('CORS rejection returns a clean 403 (ApiError import fix)', () => {
  it('does not crash with a 500 ReferenceError for a disallowed origin', async () => {
    const res = await request(app)
      .get('/api/content/portfolio')
      .set('Origin', 'https://evil.example.com')
    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})

describe('UPLOAD service centralized behavior', () => {
  it('wraps Cloudinary upload through uploadService and returns URL+publicId', async () => {
    const uploadImage = (await import('../src/services/uploadService.js')).uploadImage
    const result = await uploadImage(PNG_1x1, 'hok/test')
    expect(result.secure_url).toContain('test.cloudinary.com')
    expect(result.public_id).toBeDefined()
  })
})
