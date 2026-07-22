import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapProduct(item) {
  if (!item) return null
  return {
    ...item,
    images: (item.images || []).map((url, i) => ({ url, publicId: item.cloudinaryIds?.[i] || '' })),
    colorVariants: item.colorVariants || [],
    styleVariants: item.styleVariants || [],
    cloudinaryIds: item.cloudinaryIds || [],
  }
}

export const productService = {
  listProducts,
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
}

async function listProducts({ sort = '-createdAt', limit = 100, featured } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const where = {}
  if (featured !== undefined) where.featured = featured
  if (featured === true) where.inStock = true

  const items = await prisma.product.findMany({
    where,
    orderBy,
    take: Number(limit) || 100,
  })
  return items.map(mapProduct)
}

async function getAllProducts({ sort = '-createdAt', limit = 500 } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const items = await prisma.product.findMany({
    orderBy,
    take: Number(limit) || 500,
  })
  return { items: items.map(mapProduct) }
}

async function getProduct(id) {
  const item = await prisma.product.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Product not found')
  return mapProduct(item)
}

async function createProduct(data, files) {
  const createData = { ...data }
  const images = []
  const cloudinaryIds = []

  if (Array.isArray(files)) {
    for (const f of files) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'products')
      images.push(uploaded.url)
      cloudinaryIds.push(uploaded.path)
    }
  }

  if (images.length > 0) createData.images = images
  if (cloudinaryIds.length > 0) createData.cloudinaryIds = cloudinaryIds
  if (createData.tags && typeof createData.tags === 'string') {
    createData.tags = createData.tags.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const item = await prisma.product.create({ data: createData })
  return mapProduct(item)
}

async function updateProduct(id, data, files) {
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Product not found')

  const updateData = { ...data }
  const images = [...(existing.images || [])]
  const cloudinaryIds = [...(existing.cloudinaryIds || [])]

  if (Array.isArray(files) && files.length > 0) {
    if (existing.cloudinaryIds) {
      for (const path of existing.cloudinaryIds) await deleteFile(path)
    }
    for (const f of files) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'products')
      images.push(uploaded.url)
      cloudinaryIds.push(uploaded.path)
    }
  }

  if (files?.length > 0) {
    updateData.images = images
    updateData.cloudinaryIds = cloudinaryIds
  }

  if (updateData.tags && typeof updateData.tags === 'string') {
    updateData.tags = updateData.tags.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const item = await prisma.product.update({ where: { id }, data: updateData })
  return mapProduct(item)
}

async function deleteProduct(id) {
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Product not found')
  if (existing.cloudinaryIds) {
    for (const path of existing.cloudinaryIds) await deleteFile(path)
  }
  await prisma.product.delete({ where: { id } })
}
