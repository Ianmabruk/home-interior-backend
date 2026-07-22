import { Router } from 'express'
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
import { listConsultations, updateConsultationStatus, deleteConsultation, exportConsultationsCsv } from '../controllers/consultationController.js'
import { testimonialController } from '../controllers/testimonialController.js'

const router = Router()

router.get('/overview', dashboardOverview)
router.get('/messages', listMessages)
router.post('/test-email', sendAdminTestEmail)
router.get('/users', listUsers)
router.patch('/users/:id/:action', manageUser)
router.get('/orders', listAllOrders)
router.patch('/orders/:id/status', updateOrderStatus)
router.get('/settings', getSettings)
router.put('/settings', updateSettings)

router.get('/consultations', listConsultations)
router.get('/consultations/export', exportConsultationsCsv)
router.patch('/consultations/:id/status', updateConsultationStatus)
router.delete('/consultations/:id', deleteConsultation)

router.get('/testimonials', testimonialController.listAdmin)
router.post('/testimonials', testimonialController.create)
router.patch('/testimonials/:id', testimonialController.update)
router.delete('/testimonials/:id', testimonialController.remove)

export default router
