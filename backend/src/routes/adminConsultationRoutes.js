import { Router } from 'express'
import { consultationController } from '../controllers/consultationController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, consultationController.list)
router.patch('/:id/status', authenticate, consultationController.updateStatus)
router.delete('/:id', authenticate, consultationController.delete)
router.get('/export', authenticate, consultationController.exportCsv)

export default router
