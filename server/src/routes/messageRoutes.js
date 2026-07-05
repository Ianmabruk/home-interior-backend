import { Router } from 'express'
import { auth, authorize } from '../middleware/auth.js'
import { createMessage, listMessages, replyToMessage, createQuote } from '../controllers/messageController.js'

const router = Router()

router.post('/', createMessage)
router.post('/quote', createQuote)
router.get('/', auth, authorize('admin'), listMessages)
router.post('/reply', auth, authorize('admin'), replyToMessage)

export default router