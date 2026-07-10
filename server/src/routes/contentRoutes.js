import { Router } from 'express'
import multer from 'multer'
import {
  getAbout,
  homepageFeed,
  portfolioController,
  projectsController,
  upsertAbout,
  virtualDesignController,
  getAnalytics,
  testUpload,
} from '../controllers/contentController.js'
import { auth, authorize } from '../middleware/auth.js'
import { sanitizeInput } from '../middleware/validate.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get('/homepage', homepageFeed)
router.get('/analytics', getAnalytics)

router.get('/projects', projectsController.list)
router.post('/projects', auth, authorize('admin'), upload.single('media'), sanitizeInput, projectsController.create)
router.patch('/projects/:id', auth, authorize('admin'), upload.single('media'), sanitizeInput, projectsController.update)
router.delete('/projects/:id', auth, authorize('admin'), projectsController.remove)

router.get('/portfolio', portfolioController.list)
router.post('/portfolio', auth, authorize('admin'), upload.single('media'), sanitizeInput, portfolioController.create)
router.patch('/portfolio/:id', auth, authorize('admin'), upload.single('media'), sanitizeInput, portfolioController.update)
router.delete('/portfolio/:id', auth, authorize('admin'), portfolioController.remove)

router.get('/about', getAbout)
router.put('/about', auth, authorize('admin'), upload.single('media'), sanitizeInput, upsertAbout)

router.get('/virtual-design', virtualDesignController.list)
router.post('/virtual-design', auth, authorize('admin'), upload.single('media'), sanitizeInput, virtualDesignController.create)
router.patch('/virtual-design/:id', auth, authorize('admin'), upload.single('media'), sanitizeInput, virtualDesignController.update)
router.delete('/virtual-design/:id', auth, authorize('admin'), virtualDesignController.remove)

router.post('/test-upload', auth, authorize('admin'), upload.single('media'), sanitizeInput, testUpload)

export default router
