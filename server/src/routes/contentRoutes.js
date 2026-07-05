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
} from '../controllers/contentController.js'
import { auth, authorize } from '../middleware/auth.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get('/homepage', homepageFeed)
router.get('/analytics', getAnalytics)

router.get('/projects', projectsController.list)
router.post('/projects', auth, authorize('admin'), upload.single('media'), projectsController.create)
router.patch('/projects/:id', auth, authorize('admin'), upload.single('media'), projectsController.update)
router.delete('/projects/:id', auth, authorize('admin'), projectsController.remove)

router.get('/portfolio', portfolioController.list)
router.post('/portfolio', auth, authorize('admin'), upload.single('media'), portfolioController.create)
router.patch('/portfolio/:id', auth, authorize('admin'), upload.single('media'), portfolioController.update)
router.delete('/portfolio/:id', auth, authorize('admin'), portfolioController.remove)

router.get('/about', getAbout)
router.put('/about', auth, authorize('admin'), upload.single('media'), upsertAbout)

router.get('/virtual-design', virtualDesignController.list)
router.post('/virtual-design', auth, authorize('admin'), upload.single('media'), virtualDesignController.create)
router.patch('/virtual-design/:id', auth, authorize('admin'), upload.single('media'), virtualDesignController.update)
router.delete('/virtual-design/:id', auth, authorize('admin'), virtualDesignController.remove)

export default router
