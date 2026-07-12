import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import {
  getAbout,
  homepageFeed,
  portfolioController,
  projectsController,
  upsertAbout,
  virtualDesignController,
  getAnalytics,
  testUpload,
  deleteMediaController,
  uploadMediaController,
} from '../controllers/contentController.js'
import { auth, authorize } from '../middleware/auth.js'
import { sanitizeInput, validateFileUpload, validateBody } from '../middleware/validate.js'
import { auditLog } from '../middleware/auditLog.js'

const router = Router()
// Buffer uploads in memory (multer) but cap each file at 50MB so a single
// request cannot exhaust server RAM. The service layer enforces the stricter
// 10MB image / 50MB video business limits.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// Dedicated limiter for mutating + upload routes so an attacker cannot flood
// the API with large in-memory uploads (Cloudinary quota / RAM exhaustion).
const writeLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many write requests, please slow down.' },
})

// Light limiter for public subscribe to prevent collection abuse.
const subscribeLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many subscription attempts, please try again later.' },
})

const validateUpload = validateFileUpload('media', { maxBytes: 50 * 1024 * 1024 })

const portfolioSchema = z.object({
  title: z.string().min(1, 'title is required'),
  category: z.string().min(1, 'category is required'),
}).passthrough()

const validatePortfolioBody = validateBody(portfolioSchema)

router.get('/homepage', homepageFeed)
router.get('/analytics', auth, getAnalytics)

router.get('/projects', projectsController.list)
router.post('/projects', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, projectsController.create)
router.patch('/projects/:id', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, projectsController.update)
router.delete('/projects/:id', auth, authorize('admin'), writeLimiter, auditLog, projectsController.remove)

router.get('/portfolio', portfolioController.list)
router.patch('/portfolio/reorder', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, portfolioController.reorder)
router.post('/portfolio', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, validatePortfolioBody, portfolioController.create)
router.patch('/portfolio/:id', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, validatePortfolioBody, portfolioController.update)
router.delete('/portfolio/:id', auth, authorize('admin'), writeLimiter, auditLog, portfolioController.remove)

router.get('/about', getAbout)
router.put('/about', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, upsertAbout)

router.get('/virtual-design', virtualDesignController.list)
router.post('/virtual-design', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, virtualDesignController.create)
router.patch('/virtual-design/:id', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, virtualDesignController.update)
router.delete('/virtual-design/:id', auth, authorize('admin'), writeLimiter, auditLog, virtualDesignController.remove)

router.post('/test-upload', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, testUpload)
router.post('/media/upload', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, uploadMediaController)
router.post('/media/delete', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, deleteMediaController)

export default router
