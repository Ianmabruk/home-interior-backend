import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'
import { emailService } from '../services/emailService.js'

export const dashboardOverview = asyncHandler(async (req, res) => {
  const [products, userCount, orders, portfolioCount, users] = await Promise.all([
    prisma.product.findMany(),
    prisma.user.count(),
    prisma.order.findMany(),
    prisma.portfolio.count(),
    prisma.user.findMany({ select: { id: true, fullName: true, email: true } }),
  ])

  const userById = new Map(users.map((u) => [u.id, u]))
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const totalSales = sortedOrders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0)

  const monthlySales = (() => {
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    return sortedOrders
      .filter((order) => order.status !== 'cancelled' && new Date(order.createdAt) >= thisMonth)
      .reduce((sum, order) => sum + (Number(order.total) || 0), 0)
  })()

  const recentOrders = sortedOrders.slice(0, 10).map((o) => {
    const u = userById.get(o.userId)
    return { ...o, _id: o.id, customerName: u?.fullName || u?.email || 'Customer' }
  })

  res.json(sendSuccess({
    totalSales,
    revenue: totalSales,
    monthlySales,
    visits: 0,
    productCount: products.length,
    userCount,
    ordersCount: orders.length,
    portfolioCount,
    charts: [],
    soldUnits: 0,
    stockAvailable: 0,
    lossAmount: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    topProducts: [],
    recentOrders: withIdArray(recentOrders),
  }))
})

export const listUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500)
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(sendSuccess(withIdArray(users)))
})

export const manageUser = asyncHandler(async (req, res) => {
  const { action } = req.params
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (action === 'suspend') {
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } })
  } else if (action === 'activate') {
    await prisma.user.update({ where: { id: user.id }, data: { isActive: true } })
  } else {
    return res.status(400).json({ success: false, message: 'Invalid action' })
  }

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
  })
  res.json(sendSuccess({ message: `User ${action}d successfully`, user: withId(updated) }))
})

export const listAllOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200)
  const [orders, users] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: limit }),
    prisma.user.findMany({ select: { id: true, fullName: true, email: true } }),
  ])
  const userById = new Map(users.map((u) => [u.id, u]))

  const enriched = orders.map((o) => {
    const u = userById.get(o.userId)
    return { ...withId(o), customerName: u?.fullName || 'Guest', customerEmail: u?.email || '' }
  })

  const sorted = enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(sendSuccess(sorted))
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  const { status } = req.body
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` })
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  const updated = await prisma.order.$transaction(async (tx) => {
    const data = { status }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = Array.isArray(order.items) ? order.items : []
      for (const item of items) {
        const productId = item.product
        const qty = Number(item.quantity) || 0
        if (productId && qty > 0) {
          await tx.product.update({ where: { id: productId }, data: { stock: { increment: qty } } })
        }
      }
      data.paymentStatus = 'refunded'
    }

    return tx.order.update({ where: { id: order.id }, data })
  })

  res.json(sendSuccess(updated))
})

export const getSettings = async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!settings) {
      return res.json(sendSuccess({
        id: null,
        siteName: 'HOK Interior Designs',
        supportEmail: 'info@hokinterior.com',
        maintenanceMode: false,
        currency: 'USD',
        shippingPolicy: '',
        returnPolicy: '',
      }))
    }
    res.json(sendSuccess(withId(settings)))
  } catch (error) {
    console.error('[ADMIN][SETTINGS] error:', error?.message)
    res.json(sendSuccess({
      id: null,
      siteName: 'HOK Interior Designs',
      supportEmail: 'info@hokinterior.com',
      maintenanceMode: false,
      currency: 'USD',
      shippingPolicy: '',
      returnPolicy: '',
    }))
  }
}

export const updateSettings = asyncHandler(async (req, res) => {
  const allowed = ['siteName', 'supportEmail', 'maintenanceMode', 'currency', 'shippingPolicy', 'returnPolicy']
  const payload = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) payload[key] = req.body[key]
  }

  const existing = await prisma.settings.findFirst()
  if (!existing) {
    const created = await prisma.settings.create({ data: payload })
    return res.status(201).json(sendSuccess(withId(created)))
  }

  const updated = await prisma.settings.update({ where: { id: existing.id }, data: payload })
  res.json(sendSuccess(withId(updated)))
})

export const sendAdminTestEmail = asyncHandler(async (req, res) => {
  const to = req.body?.to || req.user?.email || env.seedAdminEmail
  const result = await emailService.send({
    to,
    subject: 'Test Email from HOK Interior Designs',
    text: 'This is a test email to verify SendGrid integration.',
    html: '<p>This is a test email to verify SendGrid integration.</p>',
  })

  res.json(sendSuccess({
    message: result.skipped ? 'Test email not sent' : 'Test email processed',
    configured: !!env.sendgridApiKey,
    sent: result.success,
    reason: result.reason || (result.success ? 'sent' : 'send failed'),
    to,
  }))
})
