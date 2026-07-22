import { Router } from 'express'
import { overview, orders, products, revenue, customers } from '../controllers/analyticsController.js'

const router = Router()

router.get('/overview', overview)
router.get('/orders', orders)
router.get('/products', products)
router.get('/revenue', revenue)
router.get('/customers', customers)

export default router
