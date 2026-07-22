import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapHero(item) {
  if (!item) return null
  return {
    ...item,
    id: item.id,
    imageUrl: item.imageUrl,
    mediaUrl: item.imageUrl,
    mediaUrls: item.mediaUrls,
    isActive: item.isActive,
    displayOrder: item.displayOrder,
  }
}

export const heroMediaService = {
  listHeroMedia,
  getHeroMedia,
  createHeroMedia,
  updateHeroMedia,
  deleteHeroMedia,
}

async function listHeroMedia() {
  const items = await prisma.heroMedia.findMany({
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapHero)
}

async function getHeroMedia(id) {
  const item = await prisma.heroMedia.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Hero media not found')
  return mapHero(item)
}

async function createHeroMedia(data, file) {
  const createData = { ...data }
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'homepage/hero')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
    createData.mediaUrls = [uploaded.url]
  }
  const item = await prisma.heroMedia.create({ data: createData })
  return mapHero(item)
}

async function updateHeroMedia(id, data, file) {
  const existing = await prisma.heroMedia.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Hero media not found')

  const updateData = { ...data }
  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const updated = await uploadFile(file.buffer, file.mimetype, 'homepage/hero')
    updateData.imageUrl = updated.url
    updateData.cloudinaryId = updated.path
    updateData.mediaUrls = [updated.url]
  }
  const item = await prisma.heroMedia.update({ where: { id }, data: updateData })
  return mapHero(item)
}

async function deleteHeroMedia(id) {
  const existing = await prisma.heroMedia.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Hero media not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  await prisma.heroMedia.delete({ where: { id } })
}
