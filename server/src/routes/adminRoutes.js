import { Router } from 'express'
import { auth, authorize } from '../middleware/auth.js'
import {
  dashboardOverview,
  sendAdminTestEmail,
  listUsers,
  manageUser,
  listAllOrders,
  updateOrderStatus,
  getSettings,
  updateSettings,
} from '../controllers/adminController.js'
import { listMessages } from '../controllers/messageController.js'

const router = Router()

router.get('/overview', auth, authorize('admin'), dashboardOverview)
router.get('/messages', auth, authorize('admin'), listMessages)
router.post('/test-email', auth, authorize('admin'), sendAdminTestEmail)
router.get('/users', auth, authorize('admin'), listUsers)
router.patch('/users/:id/:action', auth, authorize('admin'), manageUser)
router.get('/orders', auth, authorize('admin'), listAllOrders)
router.patch('/orders/:id/status', auth, authorize('admin'), updateOrderStatus)
router.get('/settings', auth, authorize('admin'), getSettings)
router.put('/settings', auth, authorize('admin'), updateSettings)

export default router
