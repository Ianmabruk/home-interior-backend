import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import {
  getAbout,
  homepageFeed,
  upsertAbout,
  deleteMediaController,
  uploadMediaController,
} from '../controllers/contentController.js'
import { heroMediaController } from '../controllers/heroController.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { serviceController } from '../controllers/serviceController.js'
import { auth, authorize } from '../middleware/auth.js'
import { sanitizeInput, validateFileUpload } from '../middleware/validate.js'

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

const validateUpload = validateFileUpload('media', { maxBytes: 50 * 1024 * 1024 })
const validateGalleryUpload = validateFileUpload('gallery', { maxBytes: 50 * 1024 * 1024 })

router.get('/homepage', homepageFeed)

router.get('/about', getAbout)
router.put('/about', auth, authorize('admin'), writeLimiter, upload.single('media'), validateUpload, sanitizeInput, upsertAbout)

router.get('/hero-media', heroMediaController.list)
router.post('/hero-media', auth, authorize('admin'), writeLimiter, upload.single('media'), validateUpload, sanitizeInput, heroMediaController.create)
router.patch('/hero-media/:id', auth, authorize('admin'), writeLimiter, upload.single('media'), validateUpload, sanitizeInput, heroMediaController.update)
router.delete('/hero-media/:id', auth, authorize('admin'), writeLimiter, sanitizeInput, heroMediaController.remove)

router.get('/portfolio', portfolioController.list)
router.get('/portfolio/:id', portfolioController.get)
router.post('/portfolio', auth, authorize('admin'), writeLimiter, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateUpload, validateGalleryUpload, sanitizeInput, portfolioController.create)
router.patch('/portfolio/:id', auth, authorize('admin'), writeLimiter, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateUpload, validateGalleryUpload, sanitizeInput, portfolioController.update)
router.delete('/portfolio/:id', auth, authorize('admin'), writeLimiter, sanitizeInput, portfolioController.remove)

router.get('/virtual-design', virtualDesignController.list)
router.get('/virtual-design/:id', virtualDesignController.get)
router.post('/virtual-design', auth, authorize('admin'), writeLimiter, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateUpload, validateGalleryUpload, sanitizeInput, virtualDesignController.create)
router.patch('/virtual-design/:id', auth, authorize('admin'), writeLimiter, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateUpload, validateGalleryUpload, sanitizeInput, virtualDesignController.update)
router.delete('/virtual-design/:id', auth, authorize('admin'), writeLimiter, sanitizeInput, virtualDesignController.remove)

router.get('/services', serviceController.list)
router.get('/services/:id', serviceController.get)
router.post('/services', auth, authorize('admin'), writeLimiter, upload.single('media'), validateUpload, sanitizeInput, serviceController.create)
router.patch('/services/:id', auth, authorize('admin'), writeLimiter, upload.single('media'), validateUpload, sanitizeInput, serviceController.update)
router.delete('/services/:id', auth, authorize('admin'), writeLimiter, sanitizeInput, serviceController.remove)

router.post('/test-upload', auth, authorize('admin'), writeLimiter, upload.single('media'), validateUpload, sanitizeInput, uploadMediaController)
router.post('/media/upload', auth, authorize('admin'), writeLimiter, upload.single('media'), validateUpload, sanitizeInput, uploadMediaController)
router.post('/media/delete', auth, authorize('admin'), writeLimiter, sanitizeInput, deleteMediaController)

export default router
