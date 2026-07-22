import { supabase } from '../config/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/sendSuccess.js'

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
  const [
    productsRes,
    usersRes,
    ordersRes,
    lowStockRes,
  ] = await Promise.all([
    supabase.from('products').select('id, name, price, stock, is_published'),
    supabase.from('users').select('id, role, created_at'),
    supabase.from('orders').select('id, total, status, payment_status, created_at, user_id, items'),
    supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 5),
  ])

  for (const r of [productsRes, usersRes, ordersRes, lowStockRes]) {
    if (r.error) throw new ApiError(500, r.error.message)
  }

  const products = productsRes.data || []
  const users = usersRes.data || []
  const orders = ordersRes.data || []
  const lowStockRows = lowStockRes.count || 0

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const paidRevenue = orders
    .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
    .reduce((s, o) => s + (Number(o.total) || 0), 0)
  const totalOrders = orders.length
  const totalCustomers = users.filter((u) => u.role !== 'admin').length
  const totalProducts = products.length

  const monthStart = startOfMonth()
  const monthlyRevenue = orders
    .filter((o) => new Date(o.created_at) >= monthStart)
    .reduce((s, o) => s + (Number(o.total) || 0), 0)
  const monthlyOrders = orders.filter((o) => new Date(o.created_at) >= monthStart).length
  const newCustomersThisMonth = users.filter((u) => new Date(u.created_at) >= monthStart && u.role !== 'admin').length

  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0

  const statusBreakdown = orders.reduce((acc, o) => {
    const key = o.status || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const paymentBreakdown = orders.reduce((acc, o) => {
    const key = o.payment_status || 'unknown'
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
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total, status, payment_status, created_at, items')
    .order('created_at', { ascending: false })

  if (error) throw new ApiError(500, error.message)

  const from = daysAgo(30)
  const perDay = buildSeries(from, (day) => {
    const key = dayKey(day)
    const dayOrders = orders.filter((o) => dayKey(o.created_at) === key)
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
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, discount_price, stock, images, color_variants, sku')

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('items')

  if (productsError) throw new ApiError(500, productsError.message)
  if (ordersError) throw new ApiError(500, ordersError.message)

  const soldByProduct = new Map()
  for (const order of orders || []) {
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

  const lowStock = (products || [])
    .filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))
  const outOfStock = (products || [])
    .filter((p) => (p.stock || 0) <= 0)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))

  res.json(sendSuccess({
    totalProducts: (products || []).length,
    topProducts,
    lowStock,
    outOfStock,
  }))
})

export const revenue = asyncHandler(async (req, res) => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total, created_at')
    .order('created_at', { ascending: true })

  if (error) throw new ApiError(500, error.message)

  const from = daysAgo(30)
  const perDay = buildSeries(from, (day) => {
    const key = dayKey(day)
    const dayOrders = orders.filter((o) => dayKey(o.created_at) === key)
    return {
      date: key,
      revenue: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    }
  })

  const monthly = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const sum = orders
      .filter((o) => { const t = new Date(o.created_at); return t >= d && t < next })
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
  const { data: users, error } = await supabase
    .from('users')
    .select('id, role, created_at')
    .order('created_at', { ascending: true })

  if (error) throw new ApiError(500, error.message)

  const customers = (users || []).filter((u) => u.role !== 'admin')
  const from = daysAgo(30)

  const perDay = buildSeries(from, (day) => {
    const key = dayKey(day)
    const count = customers.filter((u) => dayKey(u.created_at) === key).length
    return { date: key, newCustomers: count }
  })

  const growth = buildSeries(from, (day) => {
    const key = dayKey(day)
    const cumulative = customers.filter((u) => dayKey(u.created_at) <= key).length
    return { date: key, total: cumulative }
  })

  const total = customers.length
  const newThisMonth = customers.filter((u) => new Date(u.created_at) >= startOfMonth()).length

  res.json(sendSuccess({
    totalCustomers: total,
    activeCustomers: total,
    newThisMonth,
    perDay,
    growth,
  }))
})
