import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapPortfolio(item) {
  if (!item) return null
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    featured: item.featured,
    displayOrder: item.displayOrder,
    published: item.published,
    imageUrl: item.imageUrl,
    cloudinaryId: item.cloudinaryId,
    mediaUrl: item.imageUrl,
    mediaUrls: item.mediaUrls,
    galleryImages: item.mediaUrls,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const portfolioService = {
  listPortfolio,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
}

async function listPortfolio({ sort = '-createdAt', limit = 100 } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const items = await prisma.portfolioProject.findMany({
    orderBy,
    take: Number(limit) || 100,
  })
  return items.map(mapPortfolio)
}

async function getPortfolio(id) {
  const item = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Portfolio item not found')
  return mapPortfolio(item)
}

async function createPortfolio(data, file) {
  const createData = { ...data }
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'portfolio')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
  }
  const item = await prisma.portfolioProject.create({ data: createData })
  return mapPortfolio(item)
}

async function updatePortfolio(id, data, file) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')

  const updateData = { ...data }
  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'portfolio')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }
  const item = await prisma.portfolioProject.update({ where: { id }, data: updateData })
  return mapPortfolio(item)
}

async function deletePortfolio(id) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  await prisma.portfolioProject.delete({ where: { id } })
}
