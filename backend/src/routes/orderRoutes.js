import { Router } from 'express'
import { orderController } from '../controllers/orderController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/', orderController.create)
router.get('/me', authenticate, orderController.listMine)
router.get('/', authenticate, orderController.listAll)

export default router
