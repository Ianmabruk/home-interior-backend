import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { uploadSingle } from '../middleware/upload.js'

const router = Router()

router.get('/', optionalAuth, heroMediaController.list)
router.get('/:id', optionalAuth, heroMediaController.get)
router.post('/', authenticate, uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']), heroMediaController.create)
router.patch('/:id', authenticate, uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']), heroMediaController.update)
router.delete('/:id', authenticate, heroMediaController.delete)

export default router
