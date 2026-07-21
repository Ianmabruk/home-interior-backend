import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { parseBody } from '../utils/helpers.js'
import { emailService } from '../services/emailService.js'

const withId = (item) => (item == null ? item : { ...item, _id: item.id })
const withIdArray = (items) => items.map((item) => withId(item))

const normalizeShippingAddress = (addr) => {
  if (!addr || typeof addr !== 'object') return addr
  const out = { ...addr }
  if (out.address && !out.line1) out.line1 = out.address
  if (out.fullName) out.fullName = out.fullName
  if (out.email) out.email = out.email
  if (out.phone) out.phone = out.phone
  return out
}

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(10),
      quantity: z.coerce.number().int().min(1),
      variant: z.object({
        colorName: z.string().optional(),
        colorHex: z.string().optional(),
      }).optional(),
    }),
  ),
  shippingAddress: z.object({
    fullName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).passthrough(),
  paymentMethod: z.string().optional(),
  paymentDetails: z.any().optional(),
}).passthrough()

export const createOrder = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  if (!user || !user.isActive) {
    throw new ApiError(403, 'Your account is not active. Contact support.')
  }

  const data = parseBody(orderSchema, req.body)

  const productIds = data.items.map((item) => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })
  const byId = new Map(products.map((item) => [item.id, item]))

  for (const item of data.items) {
    const product = byId.get(item.productId)
    if (!product) {
      throw new ApiError(404, `Product not found: ${item.productId}`)
    }
    const requestedQty = item.quantity
    const availableStock = product.stock
    if (availableStock < requestedQty) {
      throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${availableStock}, requested: ${requestedQty}`)
    }
  }

  const items = data.items.map((item) => {
    const product = byId.get(item.productId)
    const base = {
      product: item.productId,
      name: product.name,
      image: product.images?.[0]?.url || product.images,
      quantity: item.quantity,
    }
    if (item.variant?.colorName) {
      const variant = product.colorVariants?.find((v) => v.colorName === item.variant.colorName)
      return {
        ...base,
        variant: item.variant,
        price: variant?.priceOverride || product.discountPrice || product.price,
      }
    }
    return {
      ...base,
      price: product.discountPrice || product.price,
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal

  const shippingAddress = normalizeShippingAddress(data.shippingAddress)

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: req.user.userId,
        items,
        subtotal,
        total,
        shippingAddress,
      },
    })

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return created
  })

  void emailService.send({
    to: user.email || req.user.email,
    subject: `Order Confirmation #${order.id.slice(-8)}`,
    text: `Dear ${user.fullName || 'Customer'},\n\nThank you for your order #${order.id.slice(-8)}. Total: $${total.toFixed(2)}.\n\nWe will notify you when your order ships.\n\nBest regards,\nHOK Interior Designs`,
    html: `<p>Dear ${user.fullName || 'Customer'},</p><p>Thank you for your order <strong>#${order.id.slice(-8)}</strong>. Total: <strong>$${total.toFixed(2)}</strong>.</p><p>We will notify you when your order ships.</p><p>Best regards,<br>HOK Interior Designs</p>`,
  })

  res.status(201).json(sendSuccess(withId(order)))
})

export const getMyOrders = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  const orders = await prisma.order.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(sendSuccess(withIdArray(orders)))
})

export const listOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200)
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(sendSuccess(withIdArray(orders)))
})
