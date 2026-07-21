import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseBody } from '../utils/helpers.js'
import { env } from '../config/env.js'
import { emailService } from '../services/emailService.js'

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
  const created = await prisma.consultation.create({ data: payload })

  const adminTo = env.seedAdminEmail
  if (adminTo) {
    void emailService.send({
      to: adminTo,
      subject: `New Consultation Request from ${payload.name}`,
      text: `Name: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone || 'N/A'}\nMessage: ${payload.message}\nPreferred Date: ${payload.preferredDate || 'N/A'}\nPreferred Time: ${payload.preferredTime || 'N/A'}`,
      html: `<p><strong>Name:</strong> ${payload.name}</p>
             <p><strong>Email:</strong> ${payload.email}</p>
             <p><strong>Phone:</strong> ${payload.phone || 'N/A'}</p>
             <p><strong>Message:</strong> ${payload.message}</p>
             <p><strong>Preferred Date:</strong> ${payload.preferredDate || 'N/A'}</p>
             <p><strong>Preferred Time:</strong> ${payload.preferredTime || 'N/A'}</p>`,
    })
  }

  if (payload.email) {
    void emailService.send({
      to: payload.email,
      subject: 'We received your consultation request',
      text: `Hi ${payload.name},\n\nThank you for your consultation request. We will get back to you within 24 hours.\n\nBest regards,\nHOK Interior Designs`,
      html: `<p>Hi ${payload.name},</p><p>Thank you for your consultation request. We will get back to you within 24 hours.</p><p>Best regards,<br>HOK Interior Designs</p>`,
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
  const allowed = ['new', 'read', 'replied', 'closed']
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid consultation status' })
  }

  const updated = await prisma.consultation.update({
    where: { id: req.params.id },
    data: { status },
  })
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
