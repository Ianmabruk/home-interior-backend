import { Router } from 'express'
import multer from 'multer'
import { auth, authorize } from '../middleware/auth.js'
import { dashboardOverview, sendAdminTestEmail, listUsers, listAllOrders, updateOrderStatus, getSettings, updateSettings, manageUser } from '../controllers/adminController.js'
import { listMessages } from '../controllers/messageController.js'
import { testimonialController } from '../controllers/testimonialController.js'
import { consultationController } from '../controllers/consultationController.js'
import { newsletterController } from '../controllers/newsletterController.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.get('/overview', auth, authorize('admin'), dashboardOverview)
router.get('/messages', auth, authorize('admin'), listMessages)
router.post('/test-email', auth, authorize('admin'), sendAdminTestEmail)
router.get('/users', auth, authorize('admin'), listUsers)
router.patch('/users/:id/:action', auth, authorize('admin'), manageUser)
router.get('/orders', auth, authorize('admin'), listAllOrders)
router.patch('/orders/:id/status', auth, authorize('admin'), updateOrderStatus)
router.get('/settings', auth, authorize('admin'), getSettings)
router.put('/settings', auth, authorize('admin'), updateSettings)

// Newsletter
router.get('/newsletter', auth, authorize('admin'), newsletterController.listNewsletterAdmin)
router.delete('/newsletter/:id', auth, authorize('admin'), newsletterController.deleteNewsletter)
router.post('/newsletter/send', auth, authorize('admin'), newsletterController.sendNewsletter)

// Consultations
router.get('/consultations', auth, authorize('admin'), consultationController.listConsultations)
router.patch('/consultations/:id/status', auth, authorize('admin'), consultationController.updateConsultationStatus)
router.delete('/consultations/:id', auth, authorize('admin'), consultationController.deleteConsultation)
router.get('/consultations/export', auth, authorize('admin'), consultationController.exportConsultationsCsv)

// Testimonials (managed by admin, shown in the public footer carousel).
router.get('/testimonials', auth, authorize('admin'), testimonialController.listAdmin)
router.post('/testimonials', auth, authorize('admin'), upload.single('photo'), testimonialController.create)
router.patch('/testimonials/:id', auth, authorize('admin'), upload.single('photo'), testimonialController.update)
router.patch('/testimonials/reorder', auth, authorize('admin'), testimonialController.reorder)
router.delete('/testimonials/:id', auth, authorize('admin'), testimonialController.remove)

export default router
