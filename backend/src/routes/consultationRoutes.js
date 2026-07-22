import { Router } from 'express'
import { consultationController } from '../controllers/consultationController.js'

const router = Router()

router.post('/', consultationController.publicCreate)
router.get('/', consultationController.list)

export default router
