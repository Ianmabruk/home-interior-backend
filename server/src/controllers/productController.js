import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray } from '../utils/helpers.js'

export const listProducts = async (req, res) => {
  try {
    const { q, category, sort = '-createdAt', page = 1, limit = 12 } = req.query
    const where = { isPublished: true }

    if (q) {
      const search = String(q)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = String(category)
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc'

    const safeLimit = Math.min(Number(limit), 200)
    const safePage = Math.max(1, Number(page))

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.product.count({ where }),
    ])

    res.json(sendSuccess({ items: withIdArray(items), total, page: safePage, pages: Math.ceil(total / safeLimit) }))
  } catch (error) {
    console.error('[PRODUCT][LIST] error:', error?.message)
    res.status(500).json({ success: false, message: 'Failed to fetch products' })
  }
}

export const listAllProducts = async (req, res) => {
  try {
    const { q, category, sort = '-createdAt', page = 1, limit = 100 } = req.query
    const where = {}

    if (q) {
      const search = String(q)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = String(category)
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc'

    const safeLimit = Math.min(Number(limit), 200)
    const safePage = Math.max(1, Number(page))

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.product.count({ where }),
    ])

    res.json(sendSuccess({ items: withIdArray(items), total, page: safePage, pages: Math.ceil(total / safeLimit) }))
  } catch (error) {
    console.error('[PRODUCT][LISTALL] error:', error?.message)
    res.status(500).json({ success: false, message: 'Failed to fetch products' })
  }
}

export const getProduct = async (req, res) => {
  try {
    const item = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    res.json(sendSuccess(withId(item)))
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
    discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : undefined,
    category: req.body.category || 'Mirrors',
    stock: Number(req.body.stock) || 0,
    isPublished: req.body.isPublished === 'false' || req.body.isPublished === false ? false : true,
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

  const product = await prisma.product.create({ data })
  res.status(201).json(sendSuccess(withId(product)))
})

export const updateProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Product not found' })
  }

  const data = {}
  if (req.body.name !== undefined) data.name = req.body.name
  if (req.body.description !== undefined) data.description = req.body.description
  if (req.body.price !== undefined) data.price = Number(req.body.price) || 0
  if (req.body.discountPrice !== undefined) data.discountPrice = req.body.discountPrice ? Number(req.body.discountPrice) : null
  if (req.body.category !== undefined) data.category = req.body.category
  if (req.body.stock !== undefined) data.stock = Number(req.body.stock) || 0
  if (req.body.isPublished !== undefined) data.isPublished = req.body.isPublished === 'true' || req.body.isPublished === true

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

  const updated = await prisma.product.update({ where: { id: req.params.id }, data })
  res.json(sendSuccess(withId(updated)))
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Product not found' })
  }

  const imageDeletes = (existing.images || []).map((img) => (img.publicId ? mediaService.delete(img.publicId, 'image') : Promise.resolve()))
  await Promise.all(imageDeletes)

  await prisma.product.delete({ where: { id: req.params.id } })
  res.json(sendSuccess({ message: 'Product deleted' }))
})
