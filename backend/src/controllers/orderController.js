import { asyncHandler } from '../middleware/asyncHandler.js'
import { orderService } from '../services/orderService.js'
import { failure } from '../utils/response.js'

export const orderController = {
  create: asyncHandler(async (req, res) => {
    const data = {
      email: req.body.email || '',
      name: req.body.name || '',
      phone: req.body.phone || '',
      items: typeof req.body.items === 'string' ? req.body.items : JSON.stringify(req.body.items || {}),
      shippingAddress: typeof req.body.shippingAddress === 'string' ? req.body.shippingAddress : JSON.stringify(req.body.shippingAddress || {}),
      shippingMethod: req.body.shippingMethod || 'standard',
      paymentMethod: req.body.paymentMethod || '',
      paymentDetails: typeof req.body.paymentDetails === 'string' ? req.body.paymentDetails : JSON.stringify(req.body.paymentDetails || {}),
      total: Number(req.body.total) || 0,
    }
    const order = await orderService.createOrder(data)
    res.status(201).json({ success: true, data: order })
  }),

  listMine: asyncHandler(async (req, res) => {
    const user = req.user || req.admin
    const email = user?.email || req.query.email
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' })
    }
    const orders = await orderService.getUserOrders(email)
    res.json({ success: true, data: orders })
  }),

  listAll: asyncHandler(async (req, res) => {
    const { sort } = req.query
    const orders = await orderService.getAllOrders({ sort })
    res.json({ success: true, data: orders })
  }),
}
