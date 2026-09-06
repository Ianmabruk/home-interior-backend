import { asyncHandler } from '../middleware/asyncHandler.js'
import { orderService } from '../services/orderService.js'
import { emailService } from '../services/emailService.js'
import { triggerNewOrderNotification } from '../services/notificationService.js'
import { invalidateCachePattern } from '../utils/cache.js'
import { optionalAuth } from '../middleware/auth.js'

const ALLOWED_STATUSES = [
  'order placed',
  'pending',
  'payment confirmed',
  'processing',
  'completed',
  'ready for delivery',
  'out for delivery',
  'delivered',
  'cancelled',
]

export const orderController = {
  create: asyncHandler(async (req, res) => {
    const orderId = req.headers['x-request-id'] || `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const t0 = Date.now()
    console.log(`[ORDER ${orderId}] START`)

    const shipping = req.body.shipping || req.body.shippingAddress || {}
    const name = String(shipping.fullName || shipping.name || req.body.name || '').trim()
    const email = String(shipping.email || req.body.email || '').trim()
    const phone = String(shipping.phone || req.body.phone || '').trim()

    if (!email || !name) {
      console.log(`[ORDER ${orderId}] VALIDATION_FAILED ${Date.now() - t0}ms`)
      return res.status(400).json({ success: false, message: 'Name and email are required' })
    }

    const rawItems = typeof req.body.items === 'string' ? req.body.items : JSON.stringify(Array.isArray(req.body.items) ? req.body.items : [])
    let parsedItems
    try {
      parsedItems = JSON.parse(rawItems)
    } catch {
      console.log(`[ORDER ${orderId}] VALIDATION_FAILED ${Date.now() - t0}ms`)
      return res.status(400).json({ success: false, message: 'Invalid items format' })
    }
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      console.log(`[ORDER ${orderId}] VALIDATION_FAILED ${Date.now() - t0}ms`)
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' })
    }

    const rawShipping = typeof shipping === 'string' ? shipping : JSON.stringify(shipping)
    const rawPayment = typeof req.body.paymentDetails === 'string' ? req.body.paymentDetails : JSON.stringify(req.body.paymentDetails || {})

    const data = {
      userId: req.user?.id || null,
      email,
      name,
      phone,
      items: rawItems,
      shippingAddress: rawShipping,
      shippingMethod: req.body.shippingMethod || req.body.shippingAddress?.shippingMethod || 'standard',
      paymentMethod: shipping.paymentMethod || req.body.paymentMethod || 'guest',
      paymentDetails: rawPayment,
      total: Number(req.body.total) || 0,
    }
    console.log(`[ORDER ${orderId}] VALIDATION_COMPLETE ${Date.now() - t0}ms userId=${data.userId || 'guest'}`)

    let order
    try {
      order = await orderService.createOrder(data)
    } catch (err) {
      console.error(`[ORDER ${orderId}] CREATE_FAILED ${Date.now() - t0}ms`, err?.message || err)
      throw err
    }
    console.log(`[ORDER ${orderId}] DB_TRANSACTION_COMPLETE ${Date.now() - t0}ms`)

    invalidateCachePattern('order:')
    invalidateCachePattern('orders:')

    // Fire-and-forget admin push notification (new order). Never block the
    // customer response on push delivery; failure is logged but non-fatal.
    if (order) {
      const pushT0 = Date.now()
      triggerNewOrderNotification(order).catch((e) =>
        console.warn(`[ORDER ${orderId}] PUSH_FAILED ${Date.now() - pushT0}ms`, e?.message)
      )
    }
    console.log(`[ORDER ${orderId}] RESPONSE ${Date.now() - t0}ms`)
    res.status(201).json({ success: true, data: order })
  }),

  trackOrder: asyncHandler(async (req, res) => {
    const { trackingNumber, contact } = req.body
    if (!trackingNumber || !contact) {
      return res.status(400).json({ success: false, message: 'Tracking number and contact are required' })
    }
    const order = await orderService.trackOrder(trackingNumber, contact)
    res.json({ success: true, data: order })
  }),

  listMine: asyncHandler(async (req, res) => {
    const user = req.user || req.admin
    const email = user?.email || req.query.email
    const userId = req.user?.id
    if (!email && !userId) {
      return res.status(400).json({ success: false, message: 'Email or user ID required' })
    }
    const orders = await orderService.getUserOrders(userId || email)
    res.json({ success: true, data: orders })
  }),

  listAll: asyncHandler(async (req, res) => {
    const { sort, limit, skip, pagination } = req.query
    const result = await orderService.getAllOrders({
      sort,
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
      pagination: pagination === 'true',
    })
    if (result.pagination) {
      res.json({ success: true, data: result.orders, pagination: result.pagination })
    } else {
      res.json({ success: true, data: result.orders })
    }
  }),

  get: asyncHandler(async (req, res) => {
    const order = await orderService.getOrder(req.params.id)
    if (req.admin) {
      if (req.admin.role !== 'ADMIN' && order.email !== req.admin.email) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    } else if (req.user) {
      if (order.userId && order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
      if (!order.userId && order.email !== req.user.email) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    } else {
      const requesterEmail = req.query.email
      if (!requesterEmail || order.email !== requesterEmail) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    }
    res.json({ success: true, data: order })
  }),

  getStatusHistory: asyncHandler(async (req, res) => {
    const history = await orderService.getOrderStatusHistory(req.params.id)
    res.json({ success: true, data: history })
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status, customerNote, estimatedDelivery } = req.body
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' })
    }
    const normalizedStatus = String(status).toLowerCase()
    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }
    const previous = await orderService.getOrder(req.params.id)
    const updateData = { status: normalizedStatus }
    if (customerNote !== undefined) updateData.customerNote = customerNote
    if (estimatedDelivery !== undefined) updateData.estimatedDelivery = estimatedDelivery
    const order = await orderService.updateOrderStatus(req.params.id, updateData)

    invalidateCachePattern('order:')
    invalidateCachePattern('orders:')

    // Notify the customer of the status change (best-effort; never block the update).
    if (previous && order.email && previous.status !== normalizedStatus) {
      emailService.sendOrderStatusUpdateEmail({
        order,
        previousStatus: previous.status,
        newStatus: normalizedStatus,
        toEmail: order.email,
      }).catch((e) => console.warn('[orders] status-update email failed:', e?.message))
    }

    res.json({ success: true, data: order })
  }),

  updatePaymentStatus: asyncHandler(async (req, res) => {
    const { paymentStatus, paymentReference } = req.body
    if (!paymentStatus) {
      return res.status(400).json({ success: false, message: 'Payment status is required' })
    }
    const normalizedPaymentStatus = String(paymentStatus).toLowerCase()
    const allowedPaymentStatuses = ['pending', 'submitted', 'confirmed', 'rejected']
    if (!allowedPaymentStatuses.includes(normalizedPaymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' })
    }
    const updateData = { paymentStatus: normalizedPaymentStatus }
    if (paymentReference !== undefined) updateData.paymentReference = paymentReference
    const order = await orderService.updateOrderStatus(req.params.id, updateData)
    res.json({ success: true, data: order })
  }),

  updateTrackingNumber: asyncHandler(async (req, res) => {
    const { trackingNumber } = req.body
    if (!trackingNumber || !String(trackingNumber).trim()) {
      return res.status(400).json({ success: false, message: 'Tracking number is required' })
    }
    const normalizedTracking = String(trackingNumber).trim().toUpperCase()
    const order = await orderService.updateOrderStatus(req.params.id, { trackingNumber: normalizedTracking })
    res.json({ success: true, data: order })
  }),
}
