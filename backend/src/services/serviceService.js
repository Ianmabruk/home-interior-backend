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
    buttonText: item.buttonText,
    buttonUrl: item.buttonUrl,
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
  const items = await prisma.service.findMany({
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapService)
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

async function createService(data, file, circularFile) {
  const createData = { ...data }
  let uploadedPaths = []

  if (file) {
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'services')
    createData.imageUrl = uploaded.url
    createData.cloudinaryId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }
  if (circularFile) {
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'services')
    createData.homepageCircularImage = uploaded.url
    createData.homepageCircularImageId = uploaded.path
    uploadedPaths.push(uploaded.path)
  }

  let item
  try {
    item = await prisma.service.create({ data: createData })
  } catch (err) {
    if (uploadedPaths.length > 0) {
      deleteFiles(uploadedPaths).catch(() => {})
    }
    throw err
  }
  return mapService(item)
}

async function updateService(id, data, file, circularFile) {
  const existing = await prisma.service.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Service not found')

  const updateData = { ...data }
  let newUploadedPaths = []

  if (file) {
    if (existing.cloudinaryId) await deleteFile(existing.cloudinaryId)
    const uploaded = await uploadFile(file.buffer, file.mimetype, 'services')
    updateData.imageUrl = uploaded.url
    updateData.cloudinaryId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  }
  if (circularFile) {
    if (existing.homepageCircularImageId) await deleteFile(existing.homepageCircularImageId)
    const uploaded = await uploadFile(circularFile.buffer, circularFile.mimetype, 'services')
    updateData.homepageCircularImage = uploaded.url
    updateData.homepageCircularImageId = uploaded.path
    newUploadedPaths.push(uploaded.path)
  }

  let item
  try {
    item = await prisma.service.update({ where: { id }, data: updateData })
  } catch (err) {
    if (newUploadedPaths.length > 0) {
      deleteFiles(newUploadedPaths).catch(() => {})
    }
    throw err
  }
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
  if (existing.cloudinaryId) {
    try {
      await deleteFile(existing.cloudinaryId)
    } catch (fileErr) {
      console.error('[serviceService] Failed to delete file for service', id, fileErr)
    }
  }
  await prisma.service.delete({ where: { id } })
}
