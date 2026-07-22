import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { testimonialController } from '../controllers/testimonialController.js'
import { uploadSingle } from '../middleware/upload.js'

const router = Router()

router.get('/', optionalAuth, testimonialController.list)
router.get('/:id', optionalAuth, testimonialController.get)
router.post('/', uploadSingle('photo', ['image/jpeg', 'image/png', 'image/webp']), testimonialController.create)
router.patch('/:id', uploadSingle('photo', ['image/jpeg', 'image/png', 'image/webp']), testimonialController.update)
router.delete('/:id', testimonialController.delete)

export default router
