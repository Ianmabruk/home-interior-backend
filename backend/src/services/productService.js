import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapProduct(item) {
  if (!item) return null
  const images = Array.isArray(item.images)
    ? item.images.map((img) => (typeof img === 'string' ? { url: img, publicId: '' } : img))
    : []
  return {
    ...item,
    _id: item.id,
    images,
    colorVariants: item.colorVariants || [],
    styleVariants: item.styleVariants || [],
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
  try {
    const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
    const where = {}
    if (featured !== undefined) where.featured = featured === 'true' || featured === true
    if (featured === true || featured === 'true') where.inStock = true

    const items = await prisma.product.findMany({
      where,
      orderBy,
      take: Number(limit) || 100,
    })
    return items.map(mapProduct)
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
    })
    return { items: items.map(mapProduct) }
  } catch {
    return { items: [] }
  }
}

async function getProduct(id) {
  const item = await prisma.product.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Product not found')
  return mapProduct(item)
}

async function createProduct(data, files) {
  const createData = { ...data }
  const imageRecords = []

  if (Array.isArray(files)) {
    for (const f of files) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'products')
      imageRecords.push({ url: uploaded.url, publicId: uploaded.path })
    }
  }

  if (imageRecords.length > 0) createData.images = imageRecords
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
  const imageRecords = [...(existing.images || [])]

  if (Array.isArray(files) && files.length > 0) {
    for (const f of files) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'products')
      imageRecords.push({ url: uploaded.url, publicId: uploaded.path })
    }
  }

  if (files?.length > 0) {
    updateData.images = imageRecords
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
  if (existing.images) {
    const publicIds = existing.images
      .map((img) => typeof img === 'string' ? img : img?.publicId)
      .filter(Boolean)
    await deleteFiles(publicIds)
  }
  await prisma.product.delete({ where: { id } })
}
