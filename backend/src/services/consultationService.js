import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

function mapConsultation(item) {
  if (!item) return null
  return {
    ...item,
    id: item.id,
    status: item.status,
    createdAt: item.createdAt,
    preferredDate: item.preferredDate,
    preferredTime: item.preferredTime,
  }
}

export const consultationService = {
  listConsultations,
  getConsultation,
  createConsultation,
  updateConsultationStatus,
  deleteConsultation,
}

async function listConsultations({ status, search, page = 1, pageSize = 10 } = {}) {
  const where = {}
  if (status && status !== 'all') where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { message: { contains: search } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.consultation.count({ where }),
  ])

  return {
    items: items.map(mapConsultation),
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}

async function getConsultation(id) {
  const item = await prisma.consultation.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Consultation not found')
  return mapConsultation(item)
}

async function createConsultation(data) {
  const consultation = await prisma.consultation.create({ data })
  return mapConsultation(consultation)
}

async function updateConsultationStatus(id, status) {
  const item = await prisma.consultation.update({
    where: { id },
    data: { status },
  })
  return mapConsultation(item)
}

async function deleteConsultation(id) {
  const existing = await prisma.consultation.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Consultation not found')
  await prisma.consultation.delete({ where: { id } })
}
