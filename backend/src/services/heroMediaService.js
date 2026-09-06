import { prisma } from '../config/database.js'
import { uploadFile, deleteFile, deleteFiles } from '../uploads/uploadService.js'
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
  const items = await prisma.heroMedia.findMany({
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapHero)
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
  let uploadedPaths = []

  if (files.length > 0) {
    const uploadPromises = files.map((f) => uploadFile(f.buffer, f.mimetype, 'homepage/hero'))
    const results = await Promise.allSettled(uploadPromises)
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        mediaUrls.push(result.value.url)
        if (result.value.path) uploadedPaths.push(result.value.path)
      }
    })
  }

  if (mediaUrls.length > 0) {
    createData.imageUrl = mediaUrls[0]
    createData.mediaUrls = mediaUrls
  }

  let item
  try {
    item = await prisma.heroMedia.create({ data: createData })
  } catch (err) {
    if (uploadedPaths.length > 0) {
      deleteFiles(uploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapHero(item)
}

async function updateHeroMedia(id, data, files = []) {
  const existing = await prisma.heroMedia.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Hero media not found')

  const updateData = { ...data }
  let newUploadedPaths = []

  if (files.length > 0) {
    const oldUrls = existing.mediaUrls || []
    if (oldUrls.length > 0) {
      try { await deleteFiles(oldUrls) } catch {}
    }
    const uploadPromises = files.map((f) => uploadFile(f.buffer, f.mimetype, 'homepage/hero'))
    const results = await Promise.allSettled(uploadPromises)
    const mediaUrls = []
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        mediaUrls.push(result.value.url)
        if (result.value.path) newUploadedPaths.push(result.value.path)
      }
    })
    updateData.mediaUrls = mediaUrls
    updateData.imageUrl = mediaUrls[0]
  }

  let item
  try {
    item = await prisma.heroMedia.update({ where: { id }, data: updateData })
  } catch (err) {
    if (newUploadedPaths.length > 0) {
      deleteFiles(newUploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapHero(item)
}

async function deleteHeroMedia(id) {
  const existing = await prisma.heroMedia.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Hero media not found')

  let cloudinaryDeleted = false
  if (existing.cloudinaryId) {
    try {
      await deleteFile(existing.cloudinaryId)
      cloudinaryDeleted = true
    } catch (error) {
      console.error('Failed to delete Cloudinary asset:', error)
    }
  }

  await prisma.heroMedia.delete({ where: { id } })

  return {
    message: 'Deleted',
    cloudinaryDeleted,
  }
}
