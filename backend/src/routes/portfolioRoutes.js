import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { uploadFields } from '../middleware/upload.js'

const router = Router()

router.get('/', portfolioController.list)
router.get('/:id', portfolioController.get)
router.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.create)
router.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.update)
router.delete('/:id', authenticate, portfolioController.delete)

export default router
