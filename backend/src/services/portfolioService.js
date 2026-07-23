import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapPortfolio(item) {
  if (!item) return null
  return {
    _id: item.id,
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
  try {
    const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
    const items = await prisma.portfolioProject.findMany({
      orderBy,
      take: Number(limit) || 100,
    })
    return items.map(mapPortfolio)
  } catch {
    return []
  }
}

async function getPortfolio(id) {
  try {
    const item = await prisma.portfolioProject.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Portfolio item not found')
    return mapPortfolio(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch portfolio item')
  }
}

async function createPortfolio(data, file, galleryFiles = []) {
  const createData = { ...data }
  const mediaUrls = []
  const mediaPublicIds = []

  for (const f of galleryFiles) {
    const uploaded = await uploadFile(f.buffer, f.mimetype, 'portfolio')
    mediaUrls.push(uploaded.url)
    mediaPublicIds.push(uploaded.path)
  }

  if (mediaUrls.length > 0) {
    createData.mediaUrls = mediaUrls
    createData.cloudinaryIds = mediaPublicIds
  }
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'portfolio')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
  } else if (!createData.imageUrl && mediaUrls.length > 0) {
    createData.imageUrl = mediaUrls[0]
    if (!createData.cloudinaryId && mediaPublicIds.length > 0) {
      createData.cloudinaryId = mediaPublicIds[0]
    }
  }
  const item = await prisma.portfolioProject.create({ data: createData })
  return mapPortfolio(item)
}

async function updatePortfolio(id, data, file, galleryFiles = []) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')

  const updateData = { ...data }
  const mediaUrls = [...(existing.mediaUrls || [])]
  const mediaPublicIds = [...(existing.cloudinaryIds || [])]

  for (const f of galleryFiles) {
    const uploaded = await uploadFile(f.buffer, f.mimetype, 'portfolio')
    mediaUrls.push(uploaded.url)
    mediaPublicIds.push(uploaded.path)
  }
  if (galleryFiles.length > 0) {
    updateData.mediaUrls = mediaUrls
    updateData.cloudinaryIds = mediaPublicIds
  }

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'portfolio')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  } else if (!updateData.imageUrl && mediaUrls.length > 0) {
    updateData.imageUrl = mediaUrls[0]
    if (!updateData.cloudinaryId && mediaPublicIds.length > 0) {
      updateData.cloudinaryId = mediaPublicIds[0]
    }
  }
  const item = await prisma.portfolioProject.update({ where: { id }, data: updateData })
  return mapPortfolio(item)
}

async function deletePortfolio(id) {
  const existing = await prisma.portfolioProject.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Portfolio item not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  if (existing.cloudinaryIds) {
    await deleteFiles(existing.cloudinaryIds.filter((id) => id && id !== existing.cloudinaryId))
  }
  await prisma.portfolioProject.delete({ where: { id } })
}
