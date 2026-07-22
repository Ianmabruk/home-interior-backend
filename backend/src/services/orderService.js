import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

export const orderService = {
  createOrder,
  getUserOrders,
  getAllOrders,
}

async function createOrder(data) {
  const order = await prisma.order.create({ data })
  return {
    id: order.id,
    email: order.email,
    name: order.name,
    phone: order.phone,
    items: order.items,
    shippingAddress: order.shippingAddress,
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    paymentDetails: order.paymentDetails,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  }
}

async function getUserOrders(email) {
  const orders = await prisma.order.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  return orders.map((o) => ({
    id: o.id,
    email: o.email,
    name: o.name,
    phone: o.phone,
    items: o.items,
    shippingAddress: o.shippingAddress,
    shippingMethod: o.shippingMethod,
    paymentMethod: o.paymentMethod,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }))
}

async function getAllOrders({ sort = '-createdAt', limit = 100 } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const orders = await prisma.order.findMany({
    orderBy,
    take: Number(limit) || 100,
  })
  return orders.map((o) => ({
    id: o.id,
    email: o.email,
    name: o.name,
    phone: o.phone,
    items: o.items,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }))
}
