import { prisma } from '../config/database.js'
import { uploadFile, deleteFile } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapService(item) {
  if (!item) return null
  return {
    ...item,
    _id: item.id,
    id: item.id,
    imageUrl: item.imageUrl,
    mediaUrl: item.imageUrl,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }
}

export const serviceService = {
  listServices,
  getService,
  createService,
  updateService,
  updateServiceOrder,
  deleteService,
}

async function listServices() {
  try {
    const items = await prisma.service.findMany({
      orderBy: { displayOrder: 'asc' },
    })
    return items.map(mapService)
  } catch {
    return []
  }
}

async function getService(id) {
  try {
    const item = await prisma.service.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Service not found')
    return mapService(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch service')
  }
}

async function createService(data, file) {
  const createData = { ...data }
  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'services')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
  }
  const item = await prisma.service.create({ data: createData })
  return mapService(item)
}

async function updateService(id, data, file) {
  const existing = await prisma.service.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Service not found')

  const updateData = { ...data }
  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'services')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
  }
  const item = await prisma.service.update({ where: { id }, data: updateData })
  return mapService(item)
}

async function updateServiceOrder(orderArray) {
  for (const item of orderArray) {
    await prisma.service.update({
      where: { id: item.id },
      data: { displayOrder: item.displayOrder },
    })
  }
}

async function deleteService(id) {
  const existing = await prisma.service.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Service not found')
  if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
  await prisma.service.delete({ where: { id } })
}
