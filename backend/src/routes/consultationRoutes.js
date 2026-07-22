import { Router } from 'express'
import { consultationController } from '../controllers/consultationController.js'

const router = Router()

router.post('/', consultationController.publicCreate)
router.get('/', consultationController.list)
router.patch('/:id/status', consultationController.updateStatus)
router.delete('/:id', consultationController.delete)
router.get('/export', consultationController.exportCsv)

export default router
