import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { adminOverviewController } from '../controllers/adminOverviewController.js'

const router = Router()

router.get('/overview', authenticate, adminOverviewController.getStats)
router.get('/settings', authenticate, adminOverviewController.getSettings)
router.put('/settings', authenticate, adminOverviewController.updateSettings)

export default router
