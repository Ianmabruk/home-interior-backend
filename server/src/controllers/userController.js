import { z } from 'zod'
import { prisma, executeWithRetry } from '../config/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

const withId = (item) => (item == null ? item : { ...item, _id: item.id })
const withIdArray = (items) => items.map((item) => withId(item))

const updateMeSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  addresses: z.any().optional(),
}).partial()

export const me = asyncHandler(async (req, res) => {
  let user
  try {
    user = await executeWithRetry(
      () =>
        prisma.user.findUnique({
          where: { id: req.user.userId },
        }),
      'USER][ME',
      { maxRetries: 2, timeout: 10000 },
    )
  } catch (err) {
    console.error('[USER][me] DB error:', err)
    return res.status(500).json({ success: false, message: 'Database error fetching user profile.' })
  }
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  const { passwordHash, refreshToken, ...safe } = user
  res.json(sendSuccess(withId(safe)))
})

export const updateMe = asyncHandler(async (req, res) => {
  const data = parseBody(updateMeSchema, req.body)
  const user = await prismaSafeWrite(
    (writeData) => prisma.user.update({
      where: { id: req.user.userId },
      data: writeData,
    }),
    {
      fullName: data.fullName,
      phone: data.phone,
      addresses: data.addresses,
    },
    'USER][UPDATE_ME',
  )

  const { passwordHash, refreshToken, ...safe } = user
  res.json(sendSuccess(withId(safe)))
})

export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await prisma.wishlist.findFirst({
    where: { userId: req.user.userId },
  })

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: req.user.userId, products: [] },
    })
  }

  const productIds = wishlist.products || []
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  res.json(sendSuccess({ ...withId(wishlist), products: withIdArray(products) }))
})

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body
  if (!productId) {
    throw new ApiError(400, 'productId is required')
  }
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  let wishlist = await prisma.wishlist.findFirst({
    where: { userId: req.user.userId },
  })

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: req.user.userId, products: [] },
    })
  }

  const current = wishlist.products || []
  const existing = current.find((id) => id === productId)
  const updatedProducts = existing
    ? current.filter((id) => id !== productId)
    : [...current, productId]

  const updated = await prisma.wishlist.update({
    where: { id: wishlist.id },
    data: { products: updatedProducts },
  })

  const products = await prisma.product.findMany({
    where: { id: { in: updatedProducts } },
  })

  res.json(sendSuccess({ ...withId(updated), products: withIdArray(products) }))
})

export const getCart = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  })

  const cart = Array.isArray(user?.cart) ? user.cart : []
  if (!cart.length) {
    return res.json(sendSuccess({ items: [], total: 0 }))
  }

  const productIds = cart
    .map((entry) => entry?.product)
    .filter((id) => typeof id === 'string' && id.length > 0)
  if (!productIds.length) {
    return res.json(sendSuccess({ items: [], total: 0 }))
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  const byId = new Map(products.map((item) => [item.id, item]))
  const items = cart
    .map((entry) => {
      if (!entry?.product) return null
      const product = byId.get(entry.product)
      if (!product) return null
      const base = {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discountPrice || product.price,
        quantity: entry.quantity || 1,
      }
      if (entry.variant) {
        return { ...base, selectedVariant: entry.variant }
      }
      return base
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + (item.selectedVariant?.priceOverride || item.price) * item.quantity, 0)
  res.json(sendSuccess({ items, total }))
})

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant } = req.body
  if (!productId) {
    throw new ApiError(400, 'productId is required')
  }
  const qty = Number(quantity)
  if (!Number.isFinite(qty) || qty < 1) {
    throw new ApiError(400, 'Quantity must be a positive number')
  }
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  })

  const existing = (user?.cart || []).find((entry) => {
    if (variant?.colorName) {
      return entry.product === productId && entry.variant?.colorName === variant.colorName
    }
    return entry.product === productId && !entry.variant
  })

  let newCart
  if (existing) {
    newCart = user.cart.map((entry) => {
      if (variant?.colorName) {
        return entry.product === productId && entry.variant?.colorName === variant.colorName
          ? { ...entry, quantity: entry.quantity + Number(quantity) }
          : entry
      }
      return entry.product === productId && !entry.variant
        ? { ...entry, quantity: entry.quantity + Number(quantity) }
        : entry
    })
  } else {
    const cartEntry = { product: productId, quantity: Number(quantity) }
    if (variant?.colorName) cartEntry.variant = variant
    newCart = [...(user?.cart || []), cartEntry]
  }

  const updated = await prismaSafeWrite(
    () => prisma.user.update({
      where: { id: req.user.userId },
      data: { cart: newCart },
    }),
    { cart: newCart },
    'USER][ADD_CART',
  )

  const products = await prisma.product.findMany({
    where: { id: { in: newCart.map((e) => e.product) } },
  })

  const byId = new Map(products.map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      const base = {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discountPrice || product.price,
        quantity: entry.quantity,
      }
      if (entry.variant) {
        return { ...base, selectedVariant: entry.variant }
      }
      return base
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + (item.selectedVariant?.priceOverride || item.price) * item.quantity, 0)
  res.json(sendSuccess({ items, total }))
})

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity, variant } = req.body
  if (!productId) {
    throw new ApiError(400, 'productId is required')
  }
  const safeQuantity = Number(quantity)
  if (!Number.isFinite(safeQuantity) || safeQuantity < 0) {
    throw new ApiError(400, 'Quantity must be a non-negative number')
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  })

  let existing
  if (variant?.colorName) {
    existing = (user?.cart || []).find((entry) => entry.product === productId && entry.variant?.colorName === variant.colorName)
  } else {
    existing = (user?.cart || []).find((entry) => entry.product === productId && !entry.variant)
  }
  if (!existing) {
    return res.status(404).json({ message: 'Cart item not found' })
  }

  let newCart
  if (safeQuantity <= 0) {
    if (variant?.colorName) {
      newCart = user.cart.filter((entry) => !(entry.product === productId && entry.variant?.colorName === variant.colorName))
    } else {
      newCart = user.cart.filter((entry) => entry.product !== productId)
    }
  } else {
    newCart = user.cart.map((entry) => {
      if (variant?.colorName) {
        return entry.product === productId && entry.variant?.colorName === variant.colorName
          ? { ...entry, quantity: safeQuantity }
          : entry
      }
      return entry.product === productId && !entry.variant
        ? { ...entry, quantity: safeQuantity }
        : entry
    })
  }

  const updated = await prismaSafeWrite(
    () => prisma.user.update({
      where: { id: req.user.userId },
      data: { cart: newCart },
    }),
    { cart: newCart },
    'USER][ADD_CART',
  )

  const products = await prisma.product.findMany({
    where: { id: { in: newCart.map((e) => e.product) } },
  })

  const byId = new Map(products.map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      const base = {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discountPrice || product.price,
        quantity: entry.quantity,
      }
      if (entry.variant) {
        return { ...base, selectedVariant: entry.variant }
      }
      return base
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + (item.selectedVariant?.priceOverride || item.price) * item.quantity, 0)
  res.json(sendSuccess({ items, total }))
})

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params
  if (!productId) {
    throw new ApiError(400, 'productId is required')
  }
  const { colorName } = req.query

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  })

  let newCart
  if (colorName) {
    newCart = (user?.cart || []).filter((entry) => !(entry.product === productId && entry.variant?.colorName === colorName))
  } else {
    newCart = (user?.cart || []).filter((entry) => entry.product !== productId)
  }

  const updated = await prismaSafeWrite(
    () => prisma.user.update({
      where: { id: req.user.userId },
      data: { cart: newCart },
    }),
    { cart: newCart },
    'USER][ADD_CART',
  )

  const productIds = newCart.map((e) => e.product)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  const byId = new Map(products.map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      const base = {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discountPrice || product.price,
        quantity: entry.quantity,
      }
      if (entry.variant) {
        return { ...base, selectedVariant: entry.variant }
      }
      return base
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + (item.selectedVariant?.priceOverride || item.price) * item.quantity, 0)
  res.json(sendSuccess({ items, total }))
})
