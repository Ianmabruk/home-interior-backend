import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapHero(item) {
  if (!item) return null
  return {
    ...item,
    _id: item.id,
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
  try {
    const items = await prisma.heroMedia.findMany({
      orderBy: { displayOrder: 'asc' },
    })
    return items.map(mapHero)
  } catch {
    return []
  }
}

async function getHeroMedia(id) {
  try {
    const item = await prisma.heroMedia.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Hero media not found')
    return mapHero(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch hero media')
  }
}

async function createHeroMedia(data, files = []) {
  const createData = { ...data }
  const mediaUrls = []
  const mediaPublicIds = []

  for (const f of files) {
    const uploaded = await uploadFile(f.buffer, f.mimetype, 'homepage/hero')
    mediaUrls.push(uploaded.url)
    mediaPublicIds.push(uploaded.path)
  }

  if (mediaUrls.length > 0) {
    createData.imageUrl = mediaUrls[0]
    createData.mediaUrls = mediaUrls
    createData.cloudinaryIds = mediaPublicIds
  }
  const item = await prisma.heroMedia.create({ data: createData })
  return mapHero(item)
}

async function updateHeroMedia(id, data, files = []) {
  const existing = await prisma.heroMedia.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Hero media not found')

  const updateData = { ...data }
  const mediaUrls = [...(existing.mediaUrls || [])]
  const mediaPublicIds = [...(existing.cloudinaryIds || [])]

  for (const f of files) {
    const uploaded = await uploadFile(f.buffer, f.mimetype, 'homepage/hero')
    mediaUrls.push(uploaded.url)
    mediaPublicIds.push(uploaded.path)
  }

  if (files.length > 0) {
    updateData.mediaUrls = mediaUrls
    updateData.imageUrl = mediaUrls[0]
    updateData.cloudinaryIds = mediaPublicIds
  }
  const item = await prisma.heroMedia.update({ where: { id }, data: updateData })
  return mapHero(item)
}

async function deleteHeroMedia(id) {
  const existing = await prisma.heroMedia.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Hero media not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  if (existing.cloudinaryIds) {
    await deleteFiles(existing.cloudinaryIds.filter((pid) => pid && pid !== existing.cloudinaryId))
  }
  await prisma.heroMedia.delete({ where: { id } })
}
