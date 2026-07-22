import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { contentController } from '../controllers/contentController.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { serviceController } from '../controllers/serviceController.js'
import { aboutController } from '../controllers/aboutController.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { consultationController } from '../controllers/consultationController.js'
import { uploadFields } from '../middleware/upload.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/homepage', contentController.homepage)
router.get('/services', optionalAuth, serviceController.list)
router.get('/services/:id', optionalAuth, serviceController.get)
router.get('/about', optionalAuth, aboutController.get)
router.get('/hero-media', optionalAuth, heroMediaController.list)
router.get('/hero-media/:id', optionalAuth, heroMediaController.get)
router.get('/portfolio', portfolioController.list)
router.get('/portfolio/:id', portfolioController.get)
router.post('/portfolio', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.create)
router.patch('/portfolio/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.update)
router.delete('/portfolio/:id', authenticate, portfolioController.delete)
router.get('/virtual-design', virtualDesignController.list)
router.get('/virtual-design/:id', virtualDesignController.get)
router.post('/virtual-design', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.create)
router.patch('/virtual-design/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.update)
router.delete('/virtual-design/:id', authenticate, virtualDesignController.delete)
router.post('/consultations', consultationController.publicCreate)
router.get('/consultations', optionalAuth, consultationController.list)

export const portfolioRoutes = Router()
portfolioRoutes.get('/', portfolioController.list)
portfolioRoutes.get('/:id', portfolioController.get)
portfolioRoutes.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.create)
portfolioRoutes.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.update)
portfolioRoutes.delete('/:id', authenticate, portfolioController.delete)

export const virtualDesignRoutes = Router()
virtualDesignRoutes.get('/', virtualDesignController.list)
virtualDesignRoutes.get('/:id', virtualDesignController.get)
virtualDesignRoutes.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.create)
virtualDesignRoutes.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.update)
virtualDesignRoutes.delete('/:id', authenticate, virtualDesignController.delete)

export default router
