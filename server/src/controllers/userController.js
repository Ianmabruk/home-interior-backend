import { z } from 'zod'
import { supabase } from '../config/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { parseBody } from '../utils/helpers.js'

const withId = (item) => (item == null ? item : { ...item, _id: item.id })
const withIdArray = (items) => items.map((item) => withId(item))

const updateMeSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  addresses: z.any().optional(),
}).partial()

export const me = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.userId)
    .single()

  if (error || !user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  const { password_hash, refresh_token, ...safe } = user
  res.json(sendSuccess(withId(safe)))
})

export const updateMe = asyncHandler(async (req, res) => {
  const data = parseBody(updateMeSchema, req.body)
  const { data: user, error } = await supabase
    .from('users')
    .update({
      full_name: data.fullName,
      phone: data.phone,
      addresses: data.addresses,
    })
    .eq('id', req.user.userId)
    .single()

  if (error) throw new ApiError(500, error.message)
  const { password_hash, refresh_token, ...safe } = user
  res.json(sendSuccess(withId(safe)))
})

export const getWishlist = asyncHandler(async (req, res) => {
  let { data: wishlist, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('user_id', req.user.userId)
    .single()

  if (error || !wishlist) {
    const { data: created, error: createError } = await supabase
      .from('wishlists')
      .insert([{ user_id: req.user.userId, products: [] }])
      .single()

    if (createError) throw new ApiError(500, createError.message)
    wishlist = created
  }

  const productIds = wishlist.products || []
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) throw new ApiError(500, productsError.message)

  res.json(sendSuccess({ ...withId(wishlist), products: withIdArray(products || []) }))
})

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body
  if (!productId) {
    throw new ApiError(400, 'productId is required')
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  let { data: wishlist, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('user_id', req.user.userId)
    .single()

  if (error || !wishlist) {
    const { data: created, error: createError } = await supabase
      .from('wishlists')
      .insert([{ user_id: req.user.userId, products: [] }])
      .single()

    if (createError) throw new ApiError(500, createError.message)
    wishlist = created
  }

  const current = wishlist.products || []
  const existing = current.find((id) => id === productId)
  const updatedProducts = existing
    ? current.filter((id) => id !== productId)
    : [...current, productId]

  const { data: updated, error: updateError } = await supabase
    .from('wishlists')
    .update({ products: updatedProducts })
    .eq('id', wishlist.id)
    .single()

  if (updateError) throw new ApiError(500, updateError.message)

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', updatedProducts)

  if (productsError) throw new ApiError(500, productsError.message)

  res.json(sendSuccess({ ...withId(updated), products: withIdArray(products || []) }))
})

export const getCart = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.userId)
    .single()

  if (error) throw new ApiError(500, error.message)

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

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) throw new ApiError(500, productsError.message)

  const byId = new Map((products || []).map((item) => [item.id, item]))
  const items = cart
    .map((entry) => {
      if (!entry?.product) return null
      const product = byId.get(entry.product)
      if (!product) return null
      const base = {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discount_price || product.price,
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

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.userId)
    .single()

  if (userError) throw new ApiError(500, userError.message)

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

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ cart: newCart })
    .eq('id', req.user.userId)
    .single()

  if (updateError) throw new ApiError(500, updateError.message)

  const productIds = newCart.map((e) => e.product)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) throw new ApiError(500, productsError.message)

  const byId = new Map((products || []).map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      const base = {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discount_price || product.price,
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

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.userId)
    .single()

  if (userError) throw new ApiError(500, userError.message)

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

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ cart: newCart })
    .eq('id', req.user.userId)
    .single()

  if (updateError) throw new ApiError(500, updateError.message)

  const productIds = newCart.map((e) => e.product)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) throw new ApiError(500, productsError.message)

  const byId = new Map((products || []).map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      const base = {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discount_price || product.price,
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

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.userId)
    .single()

  if (userError) throw new ApiError(500, userError.message)

  let newCart
  if (colorName) {
    newCart = (user?.cart || []).filter((entry) => !(entry.product === productId && entry.variant?.colorName === colorName))
  } else {
    newCart = (user?.cart || []).filter((entry) => entry.product !== productId)
  }

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ cart: newCart })
    .eq('id', req.user.userId)
    .single()

  if (updateError) throw new ApiError(500, updateError.message)

  const productIds = newCart.map((e) => e.product)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) throw new ApiError(500, productsError.message)

  const byId = new Map((products || []).map((item) => [item.id, item]))
  const items = newCart
    .map((entry) => {
      const product = byId.get(entry.product)
      if (!product) return null
      const base = {
        _id: product.id,
        name: product.name,
        image: product.images?.[0]?.url || product.images,
        price: product.discount_price || product.price,
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
