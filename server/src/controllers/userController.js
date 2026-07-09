import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'

const withId = (item) => ({ ...item, _id: item.id })
const withIdArray = (items) => items.map((item) => withId(item))

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  })
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  const { passwordHash, refreshToken, ...safe } = user
  res.json(sendSuccess(withId(safe)))
})

export const updateMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: {
      fullName: req.body.fullName,
      phone: req.body.phone,
      addresses: req.body.addresses,
    },
  })

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

  const cart = user?.cart || []
  if (!cart.length) {
    return res.json(sendSuccess({ items: [], total: 0 }))
  }

  const productIds = cart.map((entry) => entry.product)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  const byId = new Map(products.map((item) => [item.id, item]))
  const items = cart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      return {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discountPrice || product.price,
        quantity: entry.quantity,
      }
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  res.json(sendSuccess({ items, total }))
})

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  })

  const existing = (user?.cart || []).find((entry) => entry.product === productId)
  let newCart
  if (existing) {
    newCart = user.cart.map((entry) =>
      entry.product === productId ? { ...entry, quantity: entry.quantity + Number(quantity) } : entry,
    )
  } else {
    newCart = [...(user?.cart || []), { product: productId, quantity: Number(quantity) }]
  }

  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data: { cart: newCart },
  })

  const products = await prisma.product.findMany({
    where: { id: { in: newCart.map((e) => e.product) } },
  })

  const byId = new Map(products.map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      return {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discountPrice || product.price,
        quantity: entry.quantity,
      }
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  res.json(sendSuccess({ items, total }))
})

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body
  const safeQuantity = Number(quantity)

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  })

  const existing = (user?.cart || []).find((entry) => entry.product === productId)
  if (!existing) {
    return res.status(404).json({ message: 'Cart item not found' })
  }

  let newCart
  if (safeQuantity <= 0) {
    newCart = user.cart.filter((entry) => entry.product !== productId)
  } else {
    newCart = user.cart.map((entry) =>
      entry.product === productId ? { ...entry, quantity: safeQuantity } : entry,
    )
  }

  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data: { cart: newCart },
  })

  const products = await prisma.product.findMany({
    where: { id: { in: newCart.map((e) => e.product) } },
  })

  const byId = new Map(products.map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      return {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discountPrice || product.price,
        quantity: entry.quantity,
      }
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  res.json(sendSuccess({ items, total }))
})

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  })

  const newCart = (user?.cart || []).filter((entry) => entry.product !== productId)

  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data: { cart: newCart },
  })

  const productIds = newCart.map((e) => e.product)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  const byId = new Map(products.map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      return {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discountPrice || product.price,
        quantity: entry.quantity,
      }
    })
    .filter(Boolean)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  res.json(sendSuccess({ items, total }))
})
