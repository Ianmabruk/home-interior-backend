import { z } from 'zod'
import { prisma } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadImage, uploadVideo, deleteMedia } from '../services/uploadService.js'
import { sendEmail, buildNewProductEmailTemplate } from '../config/sendgrid.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseMaybeJson, parseListField, parseMediaSettings, parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

// Multipart/form-data sends every field as a string, so `z.coerce.boolean()`
// is unsafe here: it turns the string 'false' into `true` (any non-empty
// string is truthy), which permanently breaks the Published/Featured toggles.
// This parser maps the real submitted value back to a boolean and stays
// optional so `?? true` create-time defaults still apply.
const formBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 'on') return true
  if (value === 'false' || value === '0' || value === '') return false
  return value
}, z.boolean()).optional()

const VALID_CATEGORIES = ['Mirrors', 'Frames', 'Throw Pillows']

// Prisma enum ProductCategory uses code members (ThrowPillows) mapped to the
// stored DB label "Throw Pillows". Normalize incoming category strings to the
// Prisma member name before writing.
const normalizeCategory = (value) => {
  if (value === 'Throw Pillows') return 'ThrowPillows'
  if (VALID_CATEGORIES.includes(value)) return value
  return value
}

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional(),
  category: z.enum(VALID_CATEGORIES).transform(normalizeCategory),
  vendor: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().min(2),
  tags: z.preprocess((v) => parseListField(v, []), z.array(z.string())),
  isFeatured: formBoolean,
  isPublished: formBoolean,
})

export const listProducts = async (req, res) => {
  try {
    const { q, category, sort = '-createdAt', page = 1, limit = 12 } = req.query
    const where = { isPublished: true }

    if (q) {
      const search = String(q)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = normalizeCategory(String(category))
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc'

    const safeLimit = Math.min(Number(limit), 200)
    const safePage = Number(page)

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
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
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
        { sku: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = normalizeCategory(String(category))
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc'

    const safeLimit = Math.min(Number(limit), 200)
    const safePage = Number(page)

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
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const getProduct = async (req, res) => {
  try {
    const item = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!item) {
      throw new ApiError(404, 'Product not found')
    }
    res.json(sendSuccess(withId(item)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const createProduct = async (req, res) => {
  try {
    const data = parseBody(productSchema, req.body)
    const files = req.files || []

    const uploads = await Promise.all(
        files.map((file) => uploadImage(file.buffer, 'hok/products', file.mimetype)),
    )

    const colorVariantsRaw = Array.isArray(req.body.colorVariants)
      ? req.body.colorVariants
      : parseMaybeJson(req.body.colorVariants, [])
    const colorVariants = Array.isArray(colorVariantsRaw) ? colorVariantsRaw : []

    const styleVariantsRaw = Array.isArray(req.body.styleVariants)
      ? req.body.styleVariants
      : parseMaybeJson(req.body.styleVariants, [])
    const styleVariants = Array.isArray(styleVariantsRaw) ? styleVariantsRaw : []

    const tags = parseListField(req.body.tags, [])

    const product = await prismaSafeWrite(
      (writeData) => prisma.product.create({
        data: {
          ...writeData,
          isPublished: writeData.isPublished ?? true,
          tags: Array.isArray(writeData.tags) ? writeData.tags : [],
          images: writeData.images,
          colorVariants: writeData.colorVariants,
          styleVariants: writeData.styleVariants,
          mediaSettings: writeData.mediaSettings,
        },
      }),
      {
        ...data,
        isPublished: data.isPublished ?? true,
        tags: Array.isArray(tags) ? tags : [],
        images: uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id })),
        colorVariants,
        styleVariants,
        mediaSettings: parseMediaSettings(req.body.mediaSettings) || undefined,
      },
      'PRODUCT][CREATE',
    )

    try {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
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

    res.status(201).json(sendSuccess(withId(product)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const data = parseBody(productSchema.partial(), req.body)
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) {
      throw new ApiError(404, 'Product not found')
    }

    const files = req.files || []
    if (files.length > 0) {
      const oldImages = Array.isArray(product.images) ? product.images : []
      const oldDeletes = oldImages.map((img) => img.publicId ? deleteMedia(img.publicId, 'image') : Promise.resolve())
      const uploads = await Promise.all(
        files.map((file) => uploadImage(file.buffer, 'hok/products', file.mimetype)),
      )
      data.images = uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id }))
      await Promise.all(oldDeletes)
    }

    const colorVariantsRaw = Array.isArray(req.body.colorVariants)
      ? req.body.colorVariants
      : parseMaybeJson(req.body.colorVariants, null)
    if (Array.isArray(colorVariantsRaw)) {
      data.colorVariants = colorVariantsRaw
    }

    const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
    if (parsedMediaSettings) data.mediaSettings = parsedMediaSettings

    const styleVariantsRaw = Array.isArray(req.body.styleVariants)
      ? req.body.styleVariants
      : parseMaybeJson(req.body.styleVariants, null)
    if (Array.isArray(styleVariantsRaw)) {
      data.styleVariants = styleVariantsRaw
    }

    const updated = await prismaSafeWrite(
      (writeData) => prisma.product.update({ where: { id: req.params.id }, data: writeData }),
      data,
      'PRODUCT][UPDATE',
    )
    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) {
      throw new ApiError(404, 'Product not found')
    }

    const imageDeletes = (product.images || []).map((img) => deleteMedia(img.publicId, 'image'))
    const variantDeletes = (product.colorVariants || []).map((v) => deleteMedia(v.imagePublicId, 'image'))
    await Promise.all([...imageDeletes, ...variantDeletes])

    await prisma.product.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Product deleted' }))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const addColorVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) throw new ApiError(404, 'Product not found')

    const { colorName, colorHex = '', stockQuantity = 0, priceOverride, sku, setAsDefault } = req.body
    if (!colorName) throw new ApiError(400, 'colorName is required')
    if (!req.file) throw new ApiError(400, 'Image file is required')

    const upload = await uploadImage(req.file.buffer, 'hok/products/variants', req.file.mimetype)

    const currentVariants = Array.isArray(product.colorVariants) ? product.colorVariants : []
    const filtered = currentVariants.filter((v) => v.colorName !== colorName)
    const forceDefault = setAsDefault === true || setAsDefault === 'true'
    const isDefault = forceDefault || filtered.length === 0
    const newVariant = {
      colorName,
      colorHex,
      sku: sku ? String(sku) : undefined,
      imageUrl: upload.secure_url,
      imagePublicId: upload.public_id,
      stockQuantity: Number(stockQuantity),
      priceOverride: priceOverride !== undefined && priceOverride !== '' ? Number(priceOverride) : undefined,
      isDefault: Boolean(isDefault),
    }

    // When this new variant is flagged default, clear the flag on the others
    // so exactly one variant carries isDefault.
    const variants = [...filtered, newVariant].map((v) => ({
      ...v,
      isDefault: v.colorName === newVariant.colorName ? true : false,
    }))

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { colorVariants: variants },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const setDefaultVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) throw new ApiError(404, 'Product not found')

    const colorName = decodeURIComponent(req.params.colorName)
    const currentVariants = Array.isArray(product.colorVariants) ? product.colorVariants : []
    const target = currentVariants.find((v) => v.colorName === colorName)
    if (!target) throw new ApiError(404, 'Variant not found')

    // Ensure exactly one variant is flagged isDefault.
    const variants = currentVariants.map((v) => ({
      ...v,
      isDefault: v.colorName === colorName,
    }))

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { colorVariants: variants },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const removeColorVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) throw new ApiError(404, 'Product not found')

    const { colorName } = req.params
    if (!colorName) {
      throw new ApiError(400, 'colorName is required')
    }

    const currentVariants = Array.isArray(product.colorVariants) ? product.colorVariants : []
    const variant = currentVariants.find((v) => v.colorName === colorName)
    if (variant?.imagePublicId) {
      try {
        await deleteMedia(variant.imagePublicId, 'image')
      } catch (deleteErr) {
        console.error('[PRODUCT][VARIANT_DELETE] delete old media failed:', deleteErr?.message)
      }
    }

    const filtered = currentVariants.filter((v) => v.colorName !== colorName)

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { colorVariants: filtered },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    console.error("BODY:", req.body)
    console.error("PARAMS:", req.params)
    console.error("QUERY:", req.query)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const addStyleVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) throw new ApiError(404, 'Product not found')

    const { styleName, description = '', images = [] } = req.body
    if (!styleName) throw new ApiError(400, 'styleName is required')

    const currentVariants = Array.isArray(product.styleVariants) ? product.styleVariants : []
    const filtered = currentVariants.filter((v) => v.styleName !== styleName)
    const isDefault = filtered.length === 0
    const newVariant = {
      styleName,
      description,
      images: Array.isArray(images) ? images : [],
      isDefault,
    }

    const variants = [...filtered, newVariant].map((v) => ({
      ...v,
      isDefault: v.styleName === styleName,
    }))

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { styleVariants: variants },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const removeStyleVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) throw new ApiError(404, 'Product not found')

    const { styleName } = req.params
    if (!styleName) throw new ApiError(400, 'styleName is required')

    const currentVariants = Array.isArray(product.styleVariants) ? product.styleVariants : []
    const filtered = currentVariants.filter((v) => v.styleName !== styleName)

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { styleVariants: filtered },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

export const setDefaultStyleVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) throw new ApiError(404, 'Product not found')

    const styleName = decodeURIComponent(req.params.styleName)
    const currentVariants = Array.isArray(product.styleVariants) ? product.styleVariants : []
    const target = currentVariants.find((v) => v.styleName === styleName)
    if (!target) throw new ApiError(404, 'Style variant not found')

    const variants = currentVariants.map((v) => ({
      ...v,
      isDefault: v.styleName === styleName,
    }))

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { styleVariants: variants },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error("FULL ERROR:", error)
    console.error("MESSAGE:", error.message)
    console.error("STACK:", error.stack)
    console.error("PRISMA CODE:", error.code)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({
      success: false,
      route: req.originalUrl || req.path,
      error: error.message,
      rawMessage: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}
