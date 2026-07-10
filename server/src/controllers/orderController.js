import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendEmail, buildReceiptEmailTemplate } from '../config/sendgrid.js'
import { sendSuccess } from '../utils/sendSuccess.js'

const withId = (item) => ({ ...item, _id: item.id })
const withIdArray = (items) => items.map((item) => withId(item))

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
    line1: z.string().min(2),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().optional(),
    postalCode: z.string().min(2),
    country: z.string().min(2),
  }),
})

export const createOrder = asyncHandler(async (req, res) => {
  const data = orderSchema.parse(req.body)

  const productIds = data.items.map((item) => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })
  const byId = new Map(products.map((item) => [item.id, item]))

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

  const order = await prisma.order.create({
    data: {
      userId: req.user.userId,
      items,
      subtotal,
      total,
      shippingAddress: data.shippingAddress,
    },
  })

  try {
    const user = req.user
    await sendEmail({
      to: user.email,
      subject: `HOK Interior - Order Confirmation #${order.id.slice(-8)}`,
      html: buildReceiptEmailTemplate({
        orderId: order.id.slice(-8),
        items,
        total,
        customerName: user.fullName || user.email,
      }),
    })
  } catch (err) {
    console.error('Receipt email failed:', err)
  }

  res.status(201).json(sendSuccess(withId(order)))
})

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(sendSuccess(withIdArray(orders)))
})

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  })
  res.json(sendSuccess(withIdArray(orders)))
})
