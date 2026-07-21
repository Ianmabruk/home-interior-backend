import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import {
  getAbout,
  homepageFeed,
  upsertAbout,
  getAnalytics,
  testUpload,
  deleteMediaController,
  uploadMediaController,
  upsertHomepageContent,
  deleteHeroImagesController,
} from '../controllers/contentController.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { testimonialController } from '../controllers/testimonialController.js'
import { consultationController } from '../controllers/consultationController.js'
import { serviceController } from '../controllers/serviceController.js'
import { auth, authorize } from '../middleware/auth.js'
import { sanitizeInput, validateFileUpload, validateBody } from '../middleware/validate.js'
import { auditLog } from '../middleware/auditLog.js'

const router = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const writeLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many write requests, please slow down.' },
})

const subscribeLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many subscription attempts, please try again later.' },
})

const validateUpload = validateFileUpload('media', { maxBytes: 50 * 1024 * 1024 })
const validateGalleryUpload = validateFileUpload('gallery', { maxBytes: 50 * 1024 * 1024 })

const virtualDesignSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
}).passthrough()

const validateVirtualDesignBody = validateBody(virtualDesignSchema)

const portfolioSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
}).passthrough()

const validatePortfolioBody = validateBody(portfolioSchema)

const serviceSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
}).passthrough()

const validateServiceBody = validateBody(serviceSchema)

const consultationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
})

const validateConsultationBody = validateBody(consultationSchema)

router.get('/homepage', homepageFeed)
router.get('/analytics', auth, getAnalytics)

router.get('/portfolio', portfolioController.list)
router.get('/portfolio/:id', portfolioController.get)
router.patch('/portfolio/reorder', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, portfolioController.reorder)
router.post('/portfolio', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, validatePortfolioBody, portfolioController.create)
router.patch('/portfolio/:id', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, validatePortfolioBody, portfolioController.update)
router.delete('/portfolio/:id', auth, authorize('admin'), writeLimiter, auditLog, portfolioController.remove)

router.post('/portfolio/:id/gallery', auth, authorize('admin'), writeLimiter, auditLog, upload.array('gallery', 10), validateGalleryUpload, sanitizeInput, portfolioController.addGalleryImages)
router.delete('/portfolio/:id/gallery', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, portfolioController.removeGalleryImage)

router.get('/services', serviceController.list)
router.get('/services/:id', serviceController.get)
router.patch('/services/reorder', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, serviceController.reorder)
router.post('/services', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, validateServiceBody, serviceController.create)
router.patch('/services/:id', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, validateServiceBody, serviceController.update)
router.delete('/services/:id', auth, authorize('admin'), writeLimiter, auditLog, serviceController.remove)

router.get('/about', getAbout)
router.put('/about', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, upsertAbout)

router.put('/homepage', auth, authorize('admin'), writeLimiter, auditLog, upload.array('heroImages', 10), validateGalleryUpload, sanitizeInput, upsertHomepageContent)

router.delete('/homepage/hero-images', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, deleteHeroImagesController)
router.delete('/homepage/hero-images', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, deleteHeroImagesController)

router.post('/consultations', validateConsultationBody, consultationController.createConsultation)

router.get('/testimonials', testimonialController.listPublic)

router.get('/virtual-design', virtualDesignController.list)
router.get('/virtual-design/:id', virtualDesignController.get)
router.post('/virtual-design', auth, authorize('admin'), writeLimiter, auditLog, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateUpload, validateGalleryUpload, sanitizeInput, validateVirtualDesignBody, virtualDesignController.create)
router.patch('/virtual-design/:id', auth, authorize('admin'), writeLimiter, auditLog, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateUpload, validateGalleryUpload, sanitizeInput, validateVirtualDesignBody, virtualDesignController.update)
router.delete('/virtual-design/:id', auth, authorize('admin'), writeLimiter, auditLog, virtualDesignController.remove)

router.post('/virtual-design/:id/gallery', auth, authorize('admin'), writeLimiter, auditLog, upload.array('gallery', 10), validateGalleryUpload, sanitizeInput, virtualDesignController.addGalleryMedia)
router.delete('/virtual-design/:id/gallery', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, virtualDesignController.removeGalleryMedia)

router.post('/virtual-design/:id/gallery', auth, authorize('admin'), writeLimiter, auditLog, upload.array('gallery', 10), validateGalleryUpload, sanitizeInput, virtualDesignController.addGalleryMedia)
router.delete('/virtual-design/:id/gallery', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, virtualDesignController.removeGalleryMedia)

router.post('/test-upload', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, testUpload)
router.post('/media/upload', auth, authorize('admin'), writeLimiter, auditLog, upload.single('media'), validateUpload, sanitizeInput, uploadMediaController)
router.post('/media/delete', auth, authorize('admin'), writeLimiter, auditLog, sanitizeInput, deleteMediaController)

export default router