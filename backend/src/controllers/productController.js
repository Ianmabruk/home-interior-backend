import { asyncHandler } from '../middleware/asyncHandler.js'
import { productService } from '../services/productService.js'
import { failure } from '../utils/response.js'

export const productController = {
  list: asyncHandler(async (req, res) => {
    const { sort, limit, featured, category } = req.query
    const where = {}
    if (category) where.category = category
    const items = await productService.listProducts({ sort, limit, featured })
    res.json({ success: true, data: items })
  }),

  getAll: asyncHandler(async (req, res) => {
    const { sort, limit } = req.query
    const result = await productService.getAllProducts({ sort, limit })
    res.json({ success: true, data: result })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await productService.getProduct(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const files = req.files?.images || (req.file ? [req.file] : [])
    const data = {
      name: req.body.name || 'Untitled Product',
      description: req.body.description || '',
      price: Number(req.body.price) || 0,
      originalPrice: req.body.discountPrice ? Number(req.body.discountPrice) : undefined,
      category: req.body.category || 'Mirrors',
      vendor: req.body.vendor || '',
      stock: Number(req.body.stock) || 0,
      sku: req.body.sku || '',
      tags: req.body.tags || [],
      featured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      inStock: req.body.isPublished !== 'false' && req.body.isPublished !== false,
      displayOrder: Number(req.body.displayOrder) || 0,
      colorVariants: req.body.colorVariants ? JSON.parse(req.body.colorVariants) : [],
      styleVariants: req.body.styleVariants ? JSON.parse(req.body.styleVariants) : [],
    }
    const item = await productService.createProduct(data, files)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const files = req.files?.images || (req.file ? [req.file] : [])
    const data = {}
    if (req.body.name !== undefined) data.name = req.body.name
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.price !== undefined) data.price = Number(req.body.price)
    if (req.body.discountPrice !== undefined) data.originalPrice = Number(req.body.discountPrice)
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.vendor !== undefined) data.vendor = req.body.vendor
    if (req.body.stock !== undefined) data.stock = Number(req.body.stock)
    if (req.body.sku !== undefined) data.sku = req.body.sku
    if (req.body.tags !== undefined) data.tags = req.body.tags
    if (req.body.isFeatured !== undefined) data.featured = req.body.isFeatured === 'true' || req.body.isFeatured === true
    if (req.body.isPublished !== undefined) data.inStock = req.body.isPublished === 'false' || req.body.isPublished === false
    if (req.body.colorVariants !== undefined) data.colorVariants = JSON.parse(req.body.colorVariants)
    if (req.body.styleVariants !== undefined) data.styleVariants = JSON.parse(req.body.styleVariants)
    const item = await productService.updateProduct(req.params.id, data, files)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
