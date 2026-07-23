import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapVD(item) {
  return {
    ...item,
    _id: item.id,
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
  try {
    const items = await prisma.virtualDesign.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return items.map(mapVD)
  } catch {
    return []
  }
}

async function getVirtualDesign(id) {
  try {
    const item = await prisma.virtualDesign.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Virtual design not found')
    return mapVD(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch virtual design')
  }
}

async function createVirtualDesign(data, file, galleryFiles) {
  const createData = { ...data }
  const mediaUrls = []
  const mediaPublicIds = []

  for (const f of galleryFiles) {
    const uploaded = await uploadFile(f.buffer, f.mimetype, 'virtual-designs')
    mediaUrls.push(uploaded.url)
    mediaPublicIds.push(uploaded.path)
  }

  if (mediaUrls.length > 0) {
    createData.mediaUrls = mediaUrls
    createData.cloudinaryIds = mediaPublicIds
  }
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'virtual-designs')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
  } else if (!createData.imageUrl && mediaUrls.length > 0) {
    createData.imageUrl = mediaUrls[0]
    if (!createData.cloudinaryId && mediaPublicIds.length > 0) {
      createData.cloudinaryId = mediaPublicIds[0]
    }
  }

  const item = await prisma.virtualDesign.create({ data: createData })
  return mapVD(item)
}

async function updateVirtualDesign(id, data, file, galleryFiles) {
  try {
    const existing = await prisma.virtualDesign.findUnique({ where: { id } })
    if (!existing) throw failure(404, 'Virtual design not found')

    const updateData = { ...data }
    const mediaUrls = [...(existing.mediaUrls || [])]
    const mediaPublicIds = [...(existing.cloudinaryIds || [])]

    for (const f of galleryFiles) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'virtual-designs')
      mediaUrls.push(uploaded.url)
      mediaPublicIds.push(uploaded.path)
    }
    if (galleryFiles.length > 0) {
      updateData.mediaUrls = mediaUrls
      updateData.cloudinaryIds = mediaPublicIds
    }

    if (file) {
      if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
      const uploaded = await uploadFile(file.buffer, file.mimetype, 'virtual-designs')
      updateData.imageUrl = uploaded.url
      updateData.cloudinaryId = uploaded.path
    } else if (!updateData.imageUrl && mediaUrls.length > 0) {
      updateData.imageUrl = mediaUrls[0]
      if (!updateData.cloudinaryId && mediaPublicIds.length > 0) {
        updateData.cloudinaryId = mediaPublicIds[0]
      }
    }

    const item = await prisma.virtualDesign.update({ where: { id }, data: updateData })
    return mapVD(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to update virtual design')
  }
}

async function deleteVirtualDesign(id) {
  try {
    const existing = await prisma.virtualDesign.findUnique({ where: { id } })
    if (!existing) throw failure(404, 'Virtual design not found')
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    if (existing.cloudinaryIds) {
      await deleteFiles(existing.cloudinaryIds.filter((pid) => pid && pid !== existing.cloudinaryId))
    }
    await prisma.virtualDesign.delete({ where: { id } })
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to delete virtual design')
  }
}
