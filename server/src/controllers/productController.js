import { z } from 'zod'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadToCloudinary } from '../services/uploadService.js'
import { sendEmail, buildNewProductEmailTemplate } from '../config/sendgrid.js'

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional(),
  category: z.string().min(2),
  vendor: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().min(2),
  tags: z.array(z.string()).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isPublished: z.coerce.boolean().optional(),
})

const parseMaybeJson = (value, fallback) => {
  if (typeof value !== 'string') return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, sort = '-createdAt', page = 1, limit = 12 } = req.query
  const filter = { isPublished: true }

  if (q) {
    filter.$text = { $search: q }
  }
  if (category) {
    filter.category = category
  }

  const safeLimit = Math.min(Number(limit), 200)
  const safePage = Number(page)

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Product.countDocuments(filter),
  ])

  res.json({ items, total, page: safePage, pages: Math.ceil(total / safeLimit) })
})

export const getProduct = asyncHandler(async (req, res) => {
  const item = await Product.findById(req.params.id)
  if (!item) {
    throw new ApiError(404, 'Product not found')
  }
  res.json(item)
})

export const createProduct = asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body)
  const files = req.files || []

  const uploads = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, 'hok/products', 'image')),
  )

  // Handle color variants with per-color images
  const colorVariantsRaw = Array.isArray(req.body.colorVariants)
    ? req.body.colorVariants
    : parseMaybeJson(req.body.colorVariants, [])
  const colorVariants = Array.isArray(colorVariantsRaw) ? colorVariantsRaw : []

  const product = await Product.create({
    ...data,
    images: uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id })),
    colorVariants,
  })

  // Notify admin of new product
  try {
    const admin = await User.findOne({ role: 'admin' })
    if (admin) {
      await sendEmail({
        to: admin.email,
        subject: 'New Product Added - HOK Interior',
        html: buildNewProductEmailTemplate({
          productName: product.name,
          productPrice: product.discountPrice || product.price,
          productImageUrl: product.images?.[0]?.url,
        }),
      })
    }
  } catch (err) {
    console.error('New product notification email failed:', err)
  }

  res.status(201).json(product)
})

export const updateProduct = asyncHandler(async (req, res) => {
  const data = productSchema.partial().parse(req.body)
  const product = await Product.findById(req.params.id)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  const files = req.files || []
  if (files.length > 0) {
    const uploads = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, 'hok/products', 'image')),
    )
    data.images = uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id }))
  }

  const colorVariantsRaw = Array.isArray(req.body.colorVariants)
    ? req.body.colorVariants
    : parseMaybeJson(req.body.colorVariants, null)
  if (Array.isArray(colorVariantsRaw)) {
    data.colorVariants = colorVariantsRaw
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true })
  res.json(updated)
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }
  res.json({ message: 'Product deleted' })
})

// Upload a single color variant image for a product
export const addColorVariant = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found')

  const { colorName, colorHex = '' } = req.body
  if (!colorName) throw new ApiError(400, 'colorName is required')
  if (!req.file) throw new ApiError(400, 'Image file is required')

  const upload = await uploadToCloudinary(req.file.buffer, 'hok/products/variants', 'image')

  product.colorVariants = product.colorVariants.filter((v) => v.colorName !== colorName)
  product.colorVariants.push({ colorName, colorHex, imageUrl: upload.secure_url, imagePublicId: upload.public_id })
  await product.save()

  res.json(product)
})

export const removeColorVariant = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found')

  product.colorVariants = product.colorVariants.filter((v) => v.colorName !== req.params.colorName)
  await product.save()
  res.json(product)
})