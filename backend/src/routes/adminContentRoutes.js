import { Router } from 'express'
import { uploadFields } from '../middleware/upload.js'
import { authenticate } from '../middleware/auth.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'

export const portfolioRoutes = Router()
portfolioRoutes.get('/', authenticate, portfolioController.list)
portfolioRoutes.get('/:id', authenticate, portfolioController.get)
portfolioRoutes.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.create)
portfolioRoutes.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.update)
portfolioRoutes.delete('/:id', authenticate, portfolioController.delete)

export const virtualDesignRoutes = Router()
virtualDesignRoutes.get('/', authenticate, virtualDesignController.list)
virtualDesignRoutes.get('/:id', authenticate, virtualDesignController.get)
virtualDesignRoutes.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.create)
virtualDesignRoutes.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.update)
virtualDesignRoutes.delete('/:id', authenticate, virtualDesignController.delete)
