import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import adminRoutes from './adminRoutes.js'
import authRoutes from './authRoutes.js'
import contentRoutes from './contentRoutes.js'
import messageRoutes from './messageRoutes.js'
import { subscribeNewsletter } from '../controllers/newsletterController.js'
import orderRoutes from './orderRoutes.js'
import productRoutes from './productRoutes.js'
import userRoutes from './userRoutes.js'

const router = Router()

const subscribeLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many subscription attempts, please try again later.' },
})

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/content', contentRoutes)
router.use('/orders', orderRoutes)
router.use('/users', userRoutes)
router.use('/admin', adminRoutes)
router.use('/messages', messageRoutes)
router.post('/newsletter/subscribe', subscribeLimiter, subscribeNewsletter)

export default router
