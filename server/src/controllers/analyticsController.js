import { prisma, executeWithRetry } from '../config/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withIdArray } from '../utils/helpers.js'

// Aggregate real data from the live database. No mock/seed analytics table is
// used — every metric is computed from orders, users, and products.

const startOfMonth = () => {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

const daysAgo = (n) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (n - 1))
  return d
}

const dayKey = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Cumulative-running helper for a per-day series.
const buildSeries = (fromDate, mapFn) => {
  const series = []
  const cursor = new Date(fromDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  while (cursor <= today) {
    series.push(mapFn(new Date(cursor)))
    cursor.setDate(cursor.getDate() + 1)
  }
  return series
}

export const overview = asyncHandler(async (req, res) => {
  const { products, users, orders, lowStockRows } = await executeWithRetry(
    async () => {
      const products = await prisma.product.findMany({ select: { id: true, name: true, price: true, stock: true, isPublished: true } })
      const users = await prisma.user.findMany({ select: { id: true, role: true, createdAt: true } })
      const orders = await prisma.order.findMany({ select: { id: true, total: true, status: true, paymentStatus: true, createdAt: true, userId: true, items: true } })
      const lowStockRows = await prisma.product.count({ where: { stock: { lte: 5 } } })
      return { products, users, orders, lowStockRows }
    },
    'ANALYTICS-OVERVIEW',
    { maxRetries: 2, timeout: 15000 },
  )

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const paidRevenue = orders
    .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
    .reduce((s, o) => s + (Number(o.total) || 0), 0)
  const totalOrders = orders.length
  const totalCustomers = users.filter((u) => u.role !== 'admin').length
  const totalProducts = products.length

  const monthStart = startOfMonth()
  const monthlyRevenue = orders
    .filter((o) => new Date(o.createdAt) >= monthStart)
    .reduce((s, o) => s + (Number(o.total) || 0), 0)
  const monthlyOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart).length
  const newCustomersThisMonth = users.filter((u) => new Date(u.createdAt) >= monthStart && u.role !== 'admin').length

  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0

  const statusBreakdown = orders.reduce((acc, o) => {
    const key = o.status || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const paymentBreakdown = orders.reduce((acc, o) => {
    const key = o.paymentStatus || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  res.json(sendSuccess({
    totalRevenue,
    paidRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    monthlyRevenue,
    monthlyOrders,
    newCustomersThisMonth,
    avgOrderValue,
    lowStockCount: lowStockRows,
    outOfStockCount: products.filter((p) => (p.stock || 0) <= 0).length,
    statusBreakdown,
    paymentBreakdown,
  }))
})

export const orders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    select: { id: true, total: true, status: true, paymentStatus: true, createdAt: true, items: true },
    orderBy: { createdAt: 'desc' },
  })

  const from = daysAgo(30)
  const perDay = buildSeries(from, (day) => {
    const key = dayKey(day)
    const dayOrders = orders.filter((o) => dayKey(o.createdAt) === key)
    return {
      date: key,
      orders: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    }
  })

  const statusBreakdown = orders.reduce((acc, o) => {
    const key = o.status || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const total = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)

  res.json(sendSuccess({
    totalOrders: orders.length,
    totalRevenue: total,
    statusBreakdown,
    perDay,
  }))
})

export const products = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({ select: { id: true, name: true, price: true, discountPrice: true, stock: true, images: true, colorVariants: true, sku: true } })
  const orders = await prisma.order.findMany({ select: { items: true } })

  const soldByProduct = new Map()
  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : []
    for (const item of items) {
      const key = item.product?.toString() || item.name
      const current = soldByProduct.get(key) || {
        productId: key,
        name: item.name,
        image: item.image,
        units: 0,
        revenue: 0,
      }
      current.units += Number(item.quantity) || 0
      current.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0)
      soldByProduct.set(key, current)
    }
  }

  const topProducts = Array.from(soldByProduct.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 8)

  const lowStock = products
    .filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))
  const outOfStock = products
    .filter((p) => (p.stock || 0) <= 0)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))

  res.json(sendSuccess({
    totalProducts: products.length,
    topProducts,
    lowStock,
    outOfStock,
  }))
})

export const revenue = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const from = daysAgo(30)
  const perDay = buildSeries(from, (day) => {
    const key = dayKey(day)
    const dayOrders = orders.filter((o) => dayKey(o.createdAt) === key)
    return {
      date: key,
      revenue: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    }
  })

  // Monthly revenue for the last 12 months.
  const monthly = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const sum = orders
      .filter((o) => { const t = new Date(o.createdAt); return t >= d && t < next })
      .reduce((s, o) => s + (Number(o.total) || 0), 0)
    monthly.push({ month: label, revenue: sum })
  }

  const total = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)

  res.json(sendSuccess({
    totalRevenue: total,
    perDay,
    monthly,
  }))
})

export const customers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const customers = users.filter((u) => u.role !== 'admin')
  const from = daysAgo(30)

  // New customers per day (last 30 days).
  const perDay = buildSeries(from, (day) => {
    const key = dayKey(day)
    const count = customers.filter((u) => dayKey(u.createdAt) === key).length
    return { date: key, newCustomers: count }
  })

  // Cumulative customer growth (all-time, daily resolution over the window).
  const growth = buildSeries(from, (day) => {
    const key = dayKey(day)
    const cumulative = customers.filter((u) => dayKey(u.createdAt) <= key).length
    return { date: key, total: cumulative }
  })

  const total = customers.length
  const activeCount = customers.length // role-based; all are potential customers
  const newThisMonth = customers.filter((u) => new Date(u.createdAt) >= startOfMonth()).length

  res.json(sendSuccess({
    totalCustomers: total,
    activeCustomers: activeCount,
    newThisMonth,
    perDay,
    growth,
  }))
})
