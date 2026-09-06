import { prisma } from '../config/database.js'
import { uploadFile, deleteFiles, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'
import { getCached, setCached, invalidateCachePattern } from '../utils/cache.js'

const PRODUCTS_CACHE_TTL = 30000 // 30 seconds

function mapProduct(item) {
  if (!item) return null
  const images = Array.isArray(item.images) ? item.images : []
  const storagePaths = Array.isArray(item.storagePaths) ? item.storagePaths : []
  return {
    ...item,
    _id: item.id,
    images,
    storagePaths,
    discountPrice: item.originalPrice,
    variants: (item.variants || []).map((v) => ({
      id: v.id,
      color: v.color,
      colorHex: v.colorHex,
      image: v.image,
      stock: v.stock,
      price: v.price,
    })),
  }
}

function mapVariant(v) {
  return {
    id: v.id,
    productId: v.productId,
    color: v.color,
    image: v.image,
    stock: v.stock,
    price: v.price,
  }
}

export const productService = {
  listProducts,
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
}

async function listProducts({ sort = '-createdAt', limit = 100, featured } = {}) {
  try {
    const cacheKey = `products:list:${sort}:${limit}:${featured}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
    const where = { inStock: true }
    if (featured !== undefined) {
      where.featured = featured === 'true' || featured === true
    }

    const items = await prisma.product.findMany({
      where,
      orderBy,
      take: Number(limit) || 100,
      include: { variants: true },
    })
    const result = items.map(mapProduct)
    setCached(cacheKey, result, PRODUCTS_CACHE_TTL)
    return result
  } catch {
    return []
  }
}

async function getAllProducts({ sort = '-createdAt', limit = 500 } = {}) {
  try {
    const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
    const items = await prisma.product.findMany({
      orderBy,
      take: Number(limit) || 500,
      include: { variants: true },
    })
    return { items: items.map(mapProduct) }
  } catch {
    return { items: [] }
  }
}

async function getProduct(id) {
  const item = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  })
  if (!item) throw failure(404, 'Product not found')
  return mapProduct(item)
}

async function createProduct(data, files, variantFiles = []) {
  const createData = { ...data }
  const images = []
  const storagePaths = []
  let uploadedPaths = []

  if (Array.isArray(files)) {
    const uploadPromises = files.map((f) => uploadFile(f.buffer, f.mimetype, 'products'))
    const results = await Promise.allSettled(uploadPromises)
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        images.push(result.value.url)
        if (result.value.path) {
          storagePaths.push(result.value.path)
          uploadedPaths.push(result.value.path)
        }
      }
    })
  }

  if (images.length > 0) {
    createData.images = images
    createData.storagePaths = storagePaths
  }

  if (!createData.mainImage && images.length > 0) {
    createData.mainImage = images[0]
  }

  if (createData.tags && typeof createData.tags === 'string') {
    createData.tags = createData.tags.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const rawVariants = Array.isArray(data.variants) ? data.variants : []
  delete createData.variants

  let item
  try {
    item = await prisma.product.create({
      data: {
        ...createData,
        variants: {
          create: await Promise.all(
            rawVariants.map(async (v, idx) => {
              const imageFiles = variantFiles.filter((vf) => vf && vf.index === idx)
              let image = v.image || ''
              let storagePath = v.storagePath || ''
              if (imageFiles.length > 0) {
                const uploaded = await uploadFile(imageFiles[0].buffer, imageFiles[0].mimetype, 'product-variants')
                image = uploaded.url
                if (uploaded.path) {
                  storagePath = uploaded.path
                  uploadedPaths.push(uploaded.path)
                }
              }
              return {
                color: v.color || 'Default',
                image: image || null,
                stock: Number(v.stock) || 0,
                price: v.price ? Number(v.price) : null,
                storagePath: storagePath || null,
              }
            }),
          ),
        },
      },
      include: { variants: true },
    })
  } catch (err) {
    // Clean up uploaded files if DB creation fails
    if (uploadedPaths.length > 0) {
      deleteFiles(uploadedPaths).catch(() => {})
    }
    throw err
  }

  // Invalidate products cache after creation
  invalidateCachePattern('products:list')
  invalidateCachePattern('products:')
  return mapProduct(item)
}

async function updateProduct(id, data, files, variantFiles = []) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  })
  if (!existing) throw failure(404, 'Product not found')

  const updateData = { ...data }
  let newUploadedPaths = []

  if (Array.isArray(files) && files.length > 0) {
    const uploadPromises = files.map((f) => uploadFile(f.buffer, f.mimetype, 'products'))
    const results = await Promise.allSettled(uploadPromises)
    const newImages = []
    const newStoragePaths = []
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        newImages.push(result.value.url)
        if (result.value.path) {
          newStoragePaths.push(result.value.path)
          newUploadedPaths.push(result.value.path)
        }
      }
    })
    const images = [...newImages, ...(existing.images || [])]
    const storagePaths = [...newStoragePaths, ...(existing.storagePaths || []).filter(Boolean)]
    updateData.images = images
    updateData.storagePaths = storagePaths
    updateData.mainImage = newImages[0] || existing.mainImage
  } else if (updateData.images && Array.isArray(updateData.images)) {
    // Images sent as string URLs from frontend — replace array entirely
    updateData.mainImage = updateData.images[0]
    updateData.storagePaths = (existing.storagePaths || []).filter(Boolean)
  } else if (!updateData.mainImage && (existing.images || []).length > 0) {
    const first = existing.images[0]
    updateData.mainImage = typeof first === 'string' ? first : first?.url || null
  }

  if (updateData.tags && typeof updateData.tags === 'string') {
    updateData.tags = updateData.tags.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const rawVariants = data.variants !== undefined ? data.variants : null
  delete updateData.variants

  let updatedItem
  if (rawVariants !== null) {
    const oldVariantPaths = (existing.variants || [])
      .map((v) => v.storagePath)
      .filter(Boolean)

    const newVariants = await Promise.all(
      rawVariants.map(async (v, idx) => {
        const imageFiles = variantFiles.filter((vf) => vf && vf.index === idx)
        let image = v.image || ''
        let storagePath = v.storagePath || ''
        if (imageFiles.length > 0) {
          const uploaded = await uploadFile(imageFiles[0].buffer, imageFiles[0].mimetype, 'product-variants')
          image = uploaded.url
          if (uploaded.path) {
            storagePath = uploaded.path
            newUploadedPaths.push(uploaded.path)
          }
        }
        return {
          color: v.color || 'Default',
          image: image || null,
          stock: Number(v.stock) || 0,
          price: v.price ? Number(v.price) : null,
          storagePath: storagePath || null,
        }
      }),
    )

    try {
      await prisma.productVariant.deleteMany({ where: { productId: id } })
      if (oldVariantPaths.length > 0) {
        await deleteFiles(oldVariantPaths)
      }

      updatedItem = await prisma.product.update({
        where: { id },
        data: {
          ...updateData,
          variants: {
            create: newVariants,
          },
        },
        include: { variants: true },
      })
    } catch (err) {
      // Clean up newly uploaded files if DB update fails
      if (newUploadedPaths.length > 0) {
        deleteFiles(newUploadedPaths).catch(() => {})
      }
      throw err
    }
  } else {
    try {
      updatedItem = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { variants: true },
      })
    } catch (err) {
      if (newUploadedPaths.length > 0) {
        deleteFiles(newUploadedPaths).catch(() => {})
      }
      throw err
    }
  }

  invalidateCachePattern('products:list')
  invalidateCachePattern('products:')
  return mapProduct(updatedItem)
}

async function deleteProduct(id) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  })
  if (!existing) throw failure(404, 'Product not found')

  const allPaths = [
    ...(Array.isArray(existing.images) ? existing.images.filter(Boolean) : []),
    ...(Array.isArray(existing.storagePaths) ? existing.storagePaths.filter(Boolean) : []),
    ...(existing.variants || []).map((v) => v.storagePath).filter(Boolean),
  ]

  if (allPaths.length > 0) {
    await deleteFiles(allPaths).catch(() => {})
  }

  await prisma.product.delete({ where: { id } })

  invalidateCachePattern('products:list')
  invalidateCachePattern('products:')
  return { success: true, message: 'Product deleted' }
}

async function deleteProductImage(id, imageId) {
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Product not found')

  const images = Array.isArray(existing.images) ? existing.images : []
  const storagePaths = Array.isArray(existing.storagePaths) ? [...existing.storagePaths] : []

  let idx = -1
  if (!isNaN(Number(imageId))) {
    idx = Number(imageId)
  } else {
    idx = images.findIndex((img) => {
      const url = typeof img === 'string' ? img : img?.url
      return url === imageId
    })
  }

  if (idx === -1 || idx < 0 || idx >= images.length) throw failure(404, 'Image not found')

  if (storagePaths[idx]) {
    await deleteFile(storagePaths[idx])
  }

  const filteredImages = images.filter((_, i) => i !== idx)
  const filteredPaths = storagePaths.filter((_, i) => i !== idx)

  const updateData = {
    images: filteredImages,
    storagePaths: filteredPaths,
  }

  if (filteredImages.length > 0) {
    const first = filteredImages[0]
    updateData.mainImage = typeof first === 'string' ? first : first?.url || null
  } else {
    updateData.mainImage = null
  }

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
    include: { variants: true },
  })
  return mapProduct(updated)
}
