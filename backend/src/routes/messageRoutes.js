import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { messageController } from '../controllers/messageController.js'

const router = Router()

router.get('/', authenticate, messageController.list)
router.post('/', messageController.create)
router.post('/reply', authenticate, messageController.reply)

export default router
