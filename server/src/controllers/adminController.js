import { supabase } from '../config/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'
import { emailService } from '../services/emailService.js'

export const dashboardOverview = asyncHandler(async (req, res) => {
  const [
    productsRes,
    usersRes,
    ordersRes,
    portfolioCountRes,
  ] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('users').select('id', { count: 'exact', head: false }),
    supabase.from('orders').select('*'),
    supabase.from('portfolios').select('id', { count: 'exact', head: true }),
  ])

  for (const r of [productsRes, usersRes, ordersRes, portfolioCountRes]) {
    if (r.error) throw new ApiError(500, r.error.message)
  }

  const products = productsRes.data || []
  const users = usersRes.data || []
  const orders = ordersRes.data || []
  const portfolioCount = portfolioCountRes.count || 0

  const userById = new Map(users.map((u) => [u.id, u]))
  const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const totalSales = sortedOrders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0)

  const monthlySales = (() => {
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    return sortedOrders
      .filter((order) => order.status !== 'cancelled' && new Date(order.created_at) >= thisMonth)
      .reduce((sum, order) => sum + (Number(order.total) || 0), 0)
  })()

  const recentOrders = sortedOrders.slice(0, 10).map((o) => {
    const u = userById.get(o.user_id)
    return { ...o, _id: o.id, customerName: u?.full_name || u?.email || 'Customer' }
  })

  res.json(sendSuccess({
    totalSales,
    revenue: totalSales,
    monthlySales,
    visits: 0,
    productCount: products.length,
    userCount: users.length,
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
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at, last_login_at')
    .order('created_at', { ascending: false })
    .range(0, limit - 1)

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess(withIdArray(data || [])))
})

export const manageUser = asyncHandler(async (req, res) => {
  const { action } = req.params
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (userError || !user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (action === 'suspend') {
    const { error } = await supabase.from('users').update({ is_active: false }).eq('id', user.id)
    if (error) throw new ApiError(500, error.message)
  } else if (action === 'activate') {
    const { error } = await supabase.from('users').update({ is_active: true }).eq('id', user.id)
    if (error) throw new ApiError(500, error.message)
  } else {
    return res.status(400).json({ success: false, message: 'Invalid action' })
  }

  const { data: updated } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('id', user.id)
    .single()

  res.json(sendSuccess({ message: `User ${action}d successfully`, user: withId(updated) }))
})

export const listAllOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200)
  const [{ data: orders, error: ordersError }, { data: users, error: usersError }] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }).range(0, limit - 1),
    supabase.from('users').select('id, full_name, email'),
  ])

  for (const r of [ordersError, usersError]) {
    if (r) throw new ApiError(500, r.message)
  }

  const userById = new Map((users || []).map((u) => [u.id, u]))

  const enriched = (orders || []).map((o) => {
    const u = userById.get(o.user_id)
    return { ...withId(o), customerName: u?.full_name || 'Guest', customerEmail: u?.email || '' }
  })

  const sorted = enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  res.json(sendSuccess(sorted))
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  const { status } = req.body
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (orderError || !order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  const updatePayload = { status }
  if (status === 'cancelled' && order.status !== 'cancelled') {
    const items = Array.isArray(order.items) ? order.items : []
    for (const item of items) {
      const productId = item.product
      const qty = Number(item.quantity) || 0
      if (productId && qty > 0) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single()

        await supabase
          .from('products')
          .update({ stock: (product?.stock || 0) + qty })
          .eq('id', productId)
      }
    }
    updatePayload.payment_status = 'refunded'
  }

  const { data: updated, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', order.id)
    .single()

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess(updated))
})

export const getSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw new ApiError(500, error.message)

    if (!data || data.length === 0) {
      return res.json(sendSuccess({
        id: null,
        site_name: 'HOK Interior Designs',
        support_email: 'info@hokinterior.com',
        maintenance_mode: false,
        currency: 'USD',
        shipping_policy: '',
        return_policy: '',
      }))
    }
    res.json(sendSuccess(withId(data[0])))
  } catch (error) {
    console.error('[ADMIN][SETTINGS] error:', error?.message)
    res.json(sendSuccess({
      id: null,
      site_name: 'HOK Interior Designs',
      support_email: 'info@hokinterior.com',
      maintenance_mode: false,
      currency: 'USD',
      shipping_policy: '',
      return_policy: '',
    }))
  }
}

export const updateSettings = asyncHandler(async (req, res) => {
  const allowed = ['site_name', 'support_email', 'maintenance_mode', 'currency', 'shipping_policy', 'return_policy']
  const payload = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) payload[key] = req.body[key]
  }

  const { data: existing, error: existingError } = await supabase
    .from('settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingError) throw new ApiError(500, existingError.message)

  if (!existing || existing.length === 0) {
    const { data: created, error } = await supabase
      .from('settings')
      .insert([payload])
      .single()

    if (error) throw new ApiError(500, error.message)
    return res.status(201).json(sendSuccess(withId(created)))
  }

  const { data: updated, error } = await supabase
    .from('settings')
    .update(payload)
    .eq('id', existing[0].id)
    .single()

  if (error) throw new ApiError(500, error.message)
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
