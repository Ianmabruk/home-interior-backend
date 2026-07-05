import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { Order } from '../models/Order.js'
import { Analytics } from '../models/Analytics.js'
import { Portfolio } from '../models/Portfolio.js'
import { Project } from '../models/Project.js'
import { Settings } from '../models/Settings.js'
import { env } from '../config/env.js'
import { buildAdminTestEmailTemplate, sendEmail } from '../config/sendgrid.js'

export const dashboardOverview = asyncHandler(async (req, res) => {
  const [products, userCount, orders, analytics, portfolioCount, projectCount] = await Promise.all([
    Product.find({}).sort({ createdAt: -1 }),
    User.countDocuments(),
    Order.find({}).sort({ createdAt: -1 }),
    Analytics.find({}).sort({ date: 1 }),
    Portfolio.countDocuments(),
    Project.countDocuments(),
  ])

  const productCount = products.length

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
  const thisMonth = new Date()
  thisMonth.setDate(1)

  const monthlySales = orders
    .filter((order) => new Date(order.createdAt) >= thisMonth)
    .reduce((sum, order) => sum + order.total, 0)

  const visits = analytics.reduce((sum, row) => sum + row.visits, 0)

  const fulfilledOrders = orders.filter((order) => order.status !== 'cancelled')
  const soldUnits = fulfilledOrders.reduce(
    (sum, order) => sum + order.items.reduce((orderSum, item) => orderSum + item.quantity, 0),
    0,
  )

  const stockAvailable = products.reduce((sum, product) => sum + product.stock, 0)
  const outOfStockCount = products.filter((product) => product.stock <= 0).length
  const lowStockCount = products.filter((product) => product.stock > 0 && product.stock <= 5).length

  const lossAmount = orders
    .filter((order) => order.status === 'cancelled' || order.paymentStatus === 'refunded')
    .reduce((sum, order) => sum + order.total, 0)

  const soldByProduct = new Map()
  for (const order of fulfilledOrders) {
    for (const item of order.items) {
      const key = item.product?.toString() || item.name
      const current = soldByProduct.get(key) || { productId: key, name: item.name, units: 0, revenue: 0 }
      current.units += item.quantity
      current.revenue += item.price * item.quantity
      soldByProduct.set(key, current)
    }
  }

  const topProducts = Array.from(soldByProduct.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)

  res.json({
    totalSales,
    revenue: totalSales,
    monthlySales,
    visits,
    productCount,
    userCount,
    ordersCount: orders.length,
    portfolioCount,
    projectCount,
    charts: analytics,
    soldUnits,
    stockAvailable,
    lossAmount,
    outOfStockCount,
    lowStockCount,
    topProducts,
  })
})

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).select('-passwordHash -refreshToken')
  res.json(users)
})

export const manageUser = asyncHandler(async (req, res) => {
  const { action } = req.params
  const user = await User.findById(req.params.id)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  if (action === 'suspend') user.isActive = false
  else if (action === 'activate') user.isActive = true
  else throw new ApiError(400, 'Invalid action')

  await user.save()
  res.json({ message: `User ${action}d successfully`, user })
})

export const listAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'fullName email').sort({ createdAt: -1 })
  res.json(orders)
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!status) {
    throw new ApiError(400, 'Status is required')
  }
  const order = await Order.findById(req.params.id)
  if (!order) {
    throw new ApiError(404, 'Order not found')
  }
  order.status = status
  await order.save()
  res.json(order)
})

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne({}).sort({ createdAt: -1 })
  res.json(settings || {})
})

export const updateSettings = asyncHandler(async (req, res) => {
  const payload = { ...req.body }
  const existing = await Settings.findOne({})
  if (!existing) {
    const created = await Settings.create(payload)
    res.status(201).json(created)
    return
  }
  Object.assign(existing, payload)
  await existing.save()
  res.json(existing)
})

export const sendAdminTestEmail = asyncHandler(async (req, res) => {
  const to = req.body?.to || req.user?.email || env.seedAdminEmail
  const subject = 'HOK Admin Dashboard Test Email'
  const html = buildAdminTestEmailTemplate({
    adminEmail: req.user?.email || env.seedAdminEmail,
    timestamp: new Date().toISOString(),
  })

  const result = await sendEmail({ to, subject, html })

  res.json({
    message: result.sent ? 'Test email sent' : 'Test email not sent',
    configured: Boolean(env.sendGridApiKey),
    sent: result.sent,
    reason: result.reason || null,
    to,
  })
})
