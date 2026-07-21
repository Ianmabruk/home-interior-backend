import { z } from 'zod'
import { prisma, executeWithRetry } from '../config/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'
import { env } from '../config/env.js'

const consultationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
})

export const createConsultation = asyncHandler(async (req, res) => {
  const payload = parseBody(consultationSchema, req.body)
  const created = await prismaSafeWrite(
    (data) => prisma.consultation.create({ data }),
    payload,
    'CONSULTATION][CREATE',
  )

  const adminTo = env.seedAdminEmail
  if (adminTo) {
    console.log(`[EMAIL DISABLED] Consultation admin notification to ${adminTo} for ${payload.name}`)
    console.log(`[EMAIL DISABLED] Consultation customer notification to ${payload.email}`)
  }

  res.status(201).json(sendSuccess(withId(created)))
})

export const listConsultations = asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const search = typeof req.query.search === 'string' ? req.query.search : undefined
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const { items, total } = await executeWithRetry(
    async () => {
      const items = await prisma.consultation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
      const total = await prisma.consultation.count({ where })
      return { items, total }
    },
    'CONSULTATION-LIST',
    { maxRetries: 2, timeout: 10000 },
  )

  res.json(
    sendSuccess({
      items: withIdArray(items),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    }),
  )
})

export const updateConsultationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const allowed = ['new', 'read', 'replied', 'closed']
  if (!allowed.includes(status)) {
    throw new ApiError(400, 'Invalid consultation status')
  }

  const updated = await prismaSafeWrite(
    () =>
      prisma.consultation.update({
        where: { id: req.params.id },
        data: { status },
      }),
    { status },
    'CONSULTATION][UPDATE_STATUS',
  )

  res.json(sendSuccess(withId(updated)))
})

export const deleteConsultation = asyncHandler(async (req, res) => {
    const existing = await prisma.consultation.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Consultation not found' })
    }
    await prisma.consultation.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Consultation deleted' }))
  })

export const exportConsultationsCsv = asyncHandler(async (req, res) => {
  const items = await prisma.consultation.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const header = 'id,name,email,phone,message,status,created_at\n'
  const rows = items
    .map(
      (item) =>
        [
          item.id,
          (item.name || '').replace(/"/g, '""'),
          (item.email || '').replace(/"/g, '""'),
          (item.phone || '').replace(/"/g, '""'),
          (item.message || '').replace(/"/g, '""'),
          item.status,
          item.createdAt.toISOString(),
        ].join(','),
    )
    .join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.send(header + rows)
})

export const consultationController = {
  createConsultation,
  listConsultations,
  updateConsultationStatus,
  deleteConsultation,
  exportConsultationsCsv,
}
