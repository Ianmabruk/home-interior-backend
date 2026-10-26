import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

function mapAddOn(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price,
    currency: item.currency || 'KES',
    durationMinutes: item.durationMinutes,
    isActive: item.isActive,
    displayOrder: item.displayOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function mapPublicAddOn(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price,
    currency: item.currency || 'KES',
    durationMinutes: item.durationMinutes,
  }
}

export const addOnService = {
  listAddOnServices,
  listPublicAddOnServices,
  getAddOnService,
  createAddOnService,
  updateAddOnService,
  deleteAddOnService,
}

async function listAddOnServices(filters = {}) {
  const where = {}
  if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true' || filters.isActive === true
  const items = await prisma.addOnService.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapAddOn)
}

async function listPublicAddOnServices() {
  const items = await prisma.addOnService.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  })
  return items.map(mapPublicAddOn)
}

async function getAddOnService(id) {
  try {
    const item = await prisma.addOnService.findUnique({ where: { id } })
    if (!item) throw failure(404, 'Add-on service not found')
    return mapAddOn(item)
  } catch (err) {
    if (err?.status === 404) throw err
    throw failure(500, 'Failed to fetch add-on service')
  }
}

async function createAddOnService(data) {
  const item = await prisma.addOnService.create({
    data: {
      name: data.name,
      description: data.description || null,
      price: Number(data.price),
      currency: data.currency || 'KES',
      durationMinutes: data.durationMinutes != null ? Number(data.durationMinutes) : null,
      isActive: data.isActive !== 'false' && data.isActive !== false,
      displayOrder: Number(data.displayOrder) || 0,
    },
  })
  return mapAddOn(item)
}

async function updateAddOnService(id, data) {
  const existing = await prisma.addOnService.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Add-on service not found')

  const updateData = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.price !== undefined) updateData.price = Number(data.price)
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes != null ? Number(data.durationMinutes) : null
  if (data.isActive !== undefined) updateData.isActive = data.isActive !== 'false' && data.isActive !== false
  if (data.displayOrder !== undefined) updateData.displayOrder = Number(data.displayOrder) || 0

  const item = await prisma.addOnService.update({ where: { id }, data: updateData })
  return mapAddOn(item)
}

async function deleteAddOnService(id) {
  const existing = await prisma.addOnService.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Add-on service not found')
  await prisma.addOnService.delete({ where: { id } })
  return { message: 'Deleted' }
}
