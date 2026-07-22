import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapVD(item) {
  return {
    ...item,
    id: item.id,
    mediaUrl: item.imageUrl,
    mediaType: item.mediaType,
    galleryMedia: (item.mediaUrls || []).map((url) => ({ url, type: item.mediaType })),
    imageUrl: item.imageUrl,
    mediaUrls: item.mediaUrls,
  }
}

export const virtualDesignService = {
  listVirtualDesigns,
  getVirtualDesign,
  createVirtualDesign,
  updateVirtualDesign,
  deleteVirtualDesign,
}

async function listVirtualDesigns() {
  const items = await prisma.virtualDesign.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return items.map(mapVD)
}

async function getVirtualDesign(id) {
  const item = await prisma.virtualDesign.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Virtual design not found')
  return mapVD(item)
}

async function createVirtualDesign(data, file, galleryFiles) {
  const createData = { ...data }
  const mediaUrls = []

  for (const f of galleryFiles) {
    const uploaded = await uploadFile(f.buffer, f.mimetype, 'virtual-designs')
    mediaUrls.push(uploaded.url)
  }

  if (mediaUrls.length > 0) createData.mediaUrls = mediaUrls
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'virtual-designs')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
  }

  const item = await prisma.virtualDesign.create({ data: createData })
  return mapVD(item)
}

async function updateVirtualDesign(id, data, file, galleryFiles) {
  const existing = await prisma.virtualDesign.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Virtual design not found')

  const updateData = { ...data }
  const mediaUrls = (updateData.mediaUrls || [...(existing.mediaUrls || [])])

  for (const f of galleryFiles) {
    const uploaded = await uploadFile(f.buffer, f.mimetype, 'virtual-designs')
    mediaUrls.push(uploaded.url)
  }
  if (galleryFiles.length > 0) updateData.mediaUrls = mediaUrls

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'virtual-designs')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }

  const item = await prisma.virtualDesign.update({ where: { id }, data: updateData })
  return mapVD(item)
}

async function deleteVirtualDesign(id) {
  const existing = await prisma.virtualDesign.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Virtual design not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  if (existing.mediaUrls) {
    for (const path of existing.mediaUrls) {
      if (path && !path.startsWith('http')) await deleteFile(path)
    }
  }
  await prisma.virtualDesign.delete({ where: { id } })
}
