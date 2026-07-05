import { Router } from 'express'
import { auth, authorize } from '../middleware/auth.js'
import { createMessage, listMessages, replyToMessage } from '../controllers/messageController.js'

const router = Router()

router.post('/', createMessage)
router.get('/', auth, authorize('admin'), listMessages)
router.post('/reply', auth, authorize('admin'), replyToMessage)

export default router