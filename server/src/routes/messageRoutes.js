import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createMessage, listMessages, replyToMessage, createQuote } from '../controllers/messageController.js'

const router = Router()

const contactLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many contact attempts, please try again later.' },
})

router.post('/', contactLimiter, createMessage)
router.post('/quote', contactLimiter, createQuote)
router.get('/', listMessages)
router.post('/reply', replyToMessage)

export default router