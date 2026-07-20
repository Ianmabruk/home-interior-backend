import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import adminRoutes from './adminRoutes.js'
import authRoutes from './authRoutes.js'
import contentRoutes from './contentRoutes.js'
import messageRoutes from './messageRoutes.js'
import analyticsRoutes from './analyticsRoutes.js'
import orderRoutes from './orderRoutes.js'
import productRoutes from './productRoutes.js'
import userRoutes from './userRoutes.js'
import rebuildRoutes from './rebuildRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/content', contentRoutes)
router.use('/orders', orderRoutes)
router.use('/users', userRoutes)
router.use('/admin', adminRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/messages', messageRoutes)

// Canonical, spec-aligned API surface: /api/homepage, /api/portfolio,
// /api/virtual-designs, /api/services, /api/about, /api/testimonials,
// /api/consultations. Proxies to the same controllers as /api/content/*.
router.use('/', rebuildRoutes)

export default router
