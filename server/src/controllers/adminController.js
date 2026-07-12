import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendEmail, buildAdminTestEmailTemplate } from '../config/sendgrid.js'
import { env } from '../config/env.js'
import { sendSuccess } from '../utils/sendSuccess.js'

const withId = (item) => ({ ...item, _id: item.id })
const withIdArray = (items) => items.map((item) => withId(item))
const sortOrdersByDate = (orders) => orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

export const dashboardOverview = asyncHandler(async (req, res) => {
  const [products, userCount, ordersRaw, analyticsRaw, portfolioCount, projectCount] = await Promise.all([
    prisma.product.findMany(),
    prisma.user.count(),
    prisma.order.findMany(),
    prisma.analytics.findMany({ orderBy: { date: 'asc' } }),
    prisma.portfolio.count(),
    prisma.project.count(),
  ])

  const productCount = products.length
  const orders = sortOrdersByDate(ordersRaw)
  const analytics = analyticsRaw
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
  const thisMonth = new Date()
  thisMonth.setDate(1)

  const monthlySales = orders
    .filter((order) => new Date(order.createdAt) >= thisMonth)
    .reduce((sum, order) => sum + order.total, 0)

  const visits = analytics.reduce((sum, row) => sum + (row.visits || 0), 0)

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
      current.revenue += item.price
      soldByProduct.set(key, current)
    }
  }

  const recentOrders = sortOrdersByDate(orders).slice(0, 10)
  const topProducts = Array.from(soldByProduct.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)

  res.json(sendSuccess({
    totalSales,
    revenue: totalSales,
    monthlySales,
    visits,
    productCount,
    userCount,
    ordersCount: orders.length,
    portfolioCount,
    projectCount,
    charts: withIdArray(analytics),
    soldUnits,
    stockAvailable,
    lossAmount,
    outOfStockCount,
    lowStockCount,
    topProducts,
    recentOrders: withIdArray(recentOrders),
  }))
})

export const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(sendSuccess(withIdArray(users)))
})

export const manageUser = asyncHandler(async (req, res) => {
  const { action } = req.params
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  if (action === 'suspend') await prisma.user.update({ where: { id: user.id }, data: { isActive: false } })
  else if (action === 'activate') await prisma.user.update({ where: { id: user.id }, data: { isActive: true } })
  else throw new ApiError(400, 'Invalid action')

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
  })
  res.json(sendSuccess({ message: `User ${action}d successfully`, user: withId(updated) }))
})

export const listAllOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany()
  const sorted = sortOrdersByDate(orders)
  res.json(sendSuccess(withIdArray(sorted)))
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!status) {
    throw new ApiError(400, 'Status is required')
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
  })
  res.json(sendSuccess(withId(updated)))
})

export const getSettings = async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst({ orderBy: { createdAt: 'desc' } })
    res.json(sendSuccess(settings ? withId(settings) : null))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const updateSettings = async (req, res) => {
  try {
    const allowed = new Set([
      'siteName', 'supportEmail', 'maintenanceMode', 'currency',
      'shippingPolicy', 'returnPolicy',
    ])
    const payload = {}
    for (const key of Object.keys(req.body)) {
      if (allowed.has(key)) payload[key] = req.body[key]
    }

    const existing = await prisma.settings.findFirst()

    if (!existing) {
      const created = await prisma.settings.create({ data: payload })
      return res.status(201).json(sendSuccess(withId(created)))
    }

    const updated = await prisma.settings.update({ where: { id: existing.id }, data: payload })
    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const sendAdminTestEmail = asyncHandler(async (req, res) => {
  const to = req.body?.to || req.user?.email || env.seedAdminEmail
  const subject = 'HOK Admin Dashboard Test Email'
  const html = buildAdminTestEmailTemplate({
    adminEmail: req.user?.email || env.seedAdminEmail,
    timestamp: new Date().toISOString(),
  })

  const result = await sendEmail({ to, subject, html })

  res.json(sendSuccess({
    message: result.sent ? 'Test email sent' : 'Test email not sent',
    configured: Boolean(env.sendGridApiKey),
    sent: result.sent,
    reason: result.reason || null,
    to,
  }))
})
