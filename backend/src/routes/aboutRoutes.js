import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { aboutController } from '../controllers/aboutController.js'
import { uploadSingle } from '../middleware/upload.js'

const router = Router()

router.get('/', optionalAuth, aboutController.get)
router.post('/', authenticate, uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']), aboutController.update)
router.put('/', authenticate, uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']), aboutController.update)

export default router
