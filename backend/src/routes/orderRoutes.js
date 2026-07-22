import { Router } from 'express'
import { orderController } from '../controllers/orderController.js'

const router = Router()

router.post('/', orderController.create)
router.get('/me', orderController.listMine)
router.get('/', orderController.listAll)

export default router
