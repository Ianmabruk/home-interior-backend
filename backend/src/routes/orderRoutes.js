import { Router } from 'express'
import { orderController } from '../controllers/orderController.js'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { validateZod } from '../middleware/validateZod.js'
import { z } from 'zod'
import { createRateLimiter } from '../middleware/redisRateLimiter.js'

const router = Router()

const trackSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  contact: z.string().min(1, 'Contact is required'),
})

const trackLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  keyPrefix: 'rl:track',
})

const orderCreateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  keyPrefix: 'rl:order-create',
})

router.post('/', orderCreateLimiter, optionalAuth, orderController.create)
router.post('/track', trackLimiter, validateZod(trackSchema), orderController.trackOrder)
router.get('/me', authenticate, orderController.listMine)
router.get('/:id', optionalAuth, orderController.get)
router.get('/:id/history', authenticate, orderController.getStatusHistory)
router.get('/', authenticate, authorize('ADMIN'), orderController.listAll)
router.patch('/:id/status', authenticate, authorize('ADMIN'), validateCsrfToken, orderController.updateStatus)
router.patch('/:id/payment', authenticate, authorize('ADMIN'), validateCsrfToken, orderController.updatePaymentStatus)
router.patch('/:id/tracking', authenticate, authorize('ADMIN'), validateCsrfToken, orderController.updateTrackingNumber)

export default router
