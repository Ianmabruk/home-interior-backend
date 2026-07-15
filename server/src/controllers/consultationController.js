import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'
import { sendEmail, buildConsultationEmailTemplate } from '../config/sendgrid.js'
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

  const adminTo = env.emailFrom || env.seedAdminEmail
  if (adminTo) {
    const adminHtml = buildConsultationEmailTemplate({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      preferredDate: payload.preferredDate,
      preferredTime: payload.preferredTime,
    })
    sendEmail({ to: adminTo, subject: `New Consultation: ${payload.name}`, html: adminHtml }).catch((err) => {
      console.error('[CONSULTATION] admin email failed:', err?.message || err)
    })

    const customerHtml = buildWelcomeEmailTemplate({ fullName: payload.name, email: payload.email })
    sendEmail({ to: payload.email, subject: 'Consultation Request Received', html: customerHtml }).catch((err) => {
      console.error('[CONSULTATION] customer email failed:', err?.message || err)
    })
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

  const [items, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.consultation.count({ where }),
  ])

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
  const allowed = ['new', 'read', 'archived', 'completed']
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
