import { asyncHandler } from '../utils/asyncHandler.js'
import { supabase } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

export const listProducts = async (req, res) => {
  try {
    const { q, category, sort = '-created_at', page = 1, limit = 12 } = req.query
    let query = supabase.from('products').select('*', { count: 'exact' }).eq('is_published', true)

    if (q) {
      const search = String(q)
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    }
    if (category) {
      query = query.eq('category', String(category))
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? false : true

    const safeLimit = Math.min(Number(limit), 200)
    const safePage = Math.max(1, Number(page))
    const offset = (safePage - 1) * safeLimit

    query = query.order(sortField, { ascending: sortOrder }).range(offset, offset + safeLimit - 1)

    const { data, count, error } = await query

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess({ items: withIdArray(data || []), total: count || 0, page: safePage, pages: Math.ceil((count || 0) / safeLimit) }))
  } catch (error) {
    console.error('[PRODUCT][LIST] error:', error?.message)
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch products", stack: error?.stack })
  }
}

export const listAllProducts = async (req, res) => {
  try {
    const { q, category, sort = '-created_at', page = 1, limit = 100 } = req.query
    let query = supabase.from('products').select('*', { count: 'exact' })

    if (q) {
      const search = String(q)
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    }
    if (category) {
      query = query.eq('category', String(category))
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? false : true

    const safeLimit = Math.min(Number(limit), 200)
    const safePage = Math.max(1, Number(page))
    const offset = (safePage - 1) * safeLimit

    query = query.order(sortField, { ascending: sortOrder }).range(offset, offset + safeLimit - 1)

    const { data, count, error } = await query

    if (error) throw new ApiError(500, error.message)
    res.json(sendSuccess({ items: withIdArray(data || []), total: count || 0, page: safePage, pages: Math.ceil((count || 0) / safeLimit) }))
  } catch (error) {
    console.error('[PRODUCT][LISTALL] error:', error?.message)
    res.status(500).json({ success: false, message: error?.message || "Failed to fetch products", stack: error?.stack })
  }
}

export const getProduct = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    res.json(sendSuccess(withId(data)))
  } catch (error) {
    console.error('[PRODUCT][GET] error:', error?.message)
    res.status(500).json({ success: false, message: 'Failed to fetch product' })
  }
}

export const createProduct = asyncHandler(async (req, res) => {
  const data = {
    name: req.body.name || 'Untitled Product',
    description: req.body.description || '',
    price: Number(req.body.price) || 0,
    discount_price: req.body.discountPrice ? Number(req.body.discountPrice) : null,
    category: req.body.category || 'Mirrors',
    stock: Number(req.body.stock) || 0,
    is_published: req.body.isPublished === 'false' || req.body.isPublished === false ? false : true,
  }

  const files = Array.isArray(req.files) ? req.files : []
  if (files.length > 0) {
    const uploads = await Promise.all(
      files.map((file) => mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/products', type: 'image' }))
    )
    data.images = uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id }))
  } else if (req.body.images) {
    const parsed = (() => { try { return JSON.parse(req.body.images) } catch { return [] } })()
    if (Array.isArray(parsed)) data.images = parsed
  }

  if (!Array.isArray(data.images)) data.images = []

  const { data: product, error } = await supabase
    .from('products')
    .insert([data])
    .single()

  if (error) throw new ApiError(500, error.message)
  res.status(201).json(sendSuccess(withId(product)))
})

export const updateProduct = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (existingError || !existing) {
    return res.status(404).json({ success: false, message: 'Product not found' })
  }

  const data = {}
  if (req.body.name !== undefined) data.name = req.body.name
  if (req.body.description !== undefined) data.description = req.body.description
  if (req.body.price !== undefined) data.price = Number(req.body.price) || 0
  if (req.body.discountPrice !== undefined) data.discount_price = req.body.discountPrice ? Number(req.body.discountPrice) : null
  if (req.body.category !== undefined) data.category = req.body.category
  if (req.body.stock !== undefined) data.stock = Number(req.body.stock) || 0
  if (req.body.isPublished !== undefined) data.is_published = req.body.isPublished === 'true' || req.body.isPublished === true

  const files = Array.isArray(req.files) ? req.files : []
  if (files.length > 0) {
    const oldImages = Array.isArray(existing.images) ? existing.images : []
    const oldDeletes = oldImages.map((img) => (img.publicId ? mediaService.delete(img.publicId, 'image') : Promise.resolve()))
    const uploads = await Promise.all(
      files.map((file) => mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/products', type: 'image' }))
    )
    data.images = uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id }))
    await Promise.all(oldDeletes)
  }

  const { data: updated, error } = await supabase
    .from('products')
    .update(data)
    .eq('id', req.params.id)
    .single()

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess(withId(updated)))
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (existingError || !existing) {
    return res.status(404).json({ success: false, message: 'Product not found' })
  }

  const imageDeletes = (existing.images || []).map((img) => (img.publicId ? mediaService.delete(img.publicId, 'image') : Promise.resolve()))
  await Promise.all(imageDeletes)

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id)

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess({ message: 'Product deleted' }))
})
