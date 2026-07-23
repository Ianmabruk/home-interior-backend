import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { uploadFields } from '../middleware/upload.js'

const router = Router()

router.get('/', optionalAuth, heroMediaController.list)
router.get('/:id', optionalAuth, heroMediaController.get)
router.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.create)
router.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.update)
router.delete('/:id', authenticate, heroMediaController.delete)

export default router
