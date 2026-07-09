import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendEmail, buildQuoteEmailTemplate } from '../config/sendgrid.js'
import { sendSuccess } from '../utils/sendSuccess.js'

const withId = (item) => ({ ...item, _id: item.id })
const withIdArray = (items) => items.map((item) => withId(item))

const messageSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  content: z.string().min(10),
})

const quoteSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  projectType: z.string().min(2),
  budget: z.coerce.number().min(0),
  message: z.string().min(10),
})

export const createMessage = asyncHandler(async (req, res) => {
  const payload = messageSchema.parse(req.body)
  const created = await prisma.message.create({ data: payload })
  res.status(201).json(sendSuccess(withId(created)))
})

export const createQuote = asyncHandler(async (req, res) => {
  const payload = quoteSchema.parse(req.body)
  const created = await prisma.message.create({
    data: {
      ...payload,
      subject: `Quote Request: ${payload.projectType}`,
      content: payload.message,
      isRead: false,
    },
  })

  try {
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (admin) {
      await sendEmail({
        to: admin.email,
        subject: `New Quote Request: ${payload.projectType}`,
        html: buildQuoteEmailTemplate({
          fullName: payload.fullName,
          email: payload.email,
          projectType: payload.projectType,
          budget: payload.budget,
          message: payload.message,
        }),
      })
    }
  } catch (err) {
    console.error('Quote notification email failed:', err)
  }

  res.status(201).json(sendSuccess(withId(created)))
})

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
  })
  res.json(sendSuccess(withIdArray(messages)))
})

export const replyToMessage = asyncHandler(async (req, res) => {
  const { messageId, reply } = req.body
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) {
    return res.status(404).json({ message: 'Message not found' })
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
  })

  res.json(sendSuccess({ message: 'Reply sent', isRead: true }))
})
