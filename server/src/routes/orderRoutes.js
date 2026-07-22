import { Router } from 'express'
import { createOrder, getMyOrders, listOrders } from '../controllers/orderController.js'

const router = Router()

router.post('/', createOrder)
router.get('/me', getMyOrders)
router.get('/', listOrders)

export default router
