import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendEmail, buildQuoteEmailTemplate } from '../config/sendgrid.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

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

const replySchema = z.object({
  messageId: z.string().min(10),
  reply: z.string().min(1),
})

export const createMessage = asyncHandler(async (req, res) => {
  const payload = parseBody(messageSchema, req.body)
  const created = await prismaSafeWrite(
    (data) => prisma.message.create({ data }),
    payload,
    'MESSAGE][CREATE',
  )
  res.status(201).json(sendSuccess(withId(created)))
})

export const createQuote = asyncHandler(async (req, res) => {
  const payload = parseBody(quoteSchema, req.body)
  const created = await prismaSafeWrite(
    (data) => prisma.message.create({
      data: {
        ...data,
        subject: `Quote Request: ${data.projectType}`,
        content: data.message,
        isRead: false,
      },
    }),
    payload,
    'MESSAGE][QUOTE',
  )

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
  const limit = Math.min(Number(req.query.limit) || 100, 200)
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(sendSuccess(withIdArray(messages)))
})

export const replyToMessage = asyncHandler(async (req, res) => {
  const { messageId, reply } = parseBody(replySchema, req.body)
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) {
    return res.status(404).json({ message: 'Message not found' })
  }

  await prismaSafeWrite(
    () => prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    }),
    { isRead: true },
    'MESSAGE][REPLY',
  )

  try {
    if (message.email) {
      await sendEmail({
        to: message.email,
        subject: `Re: ${message.subject}`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #333;">
          <p>Hello ${message.name},</p>
          <p>${reply.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px;">This is a reply from HOK Interior Designs support team.</p>
        </div>`,
      })
    }
  } catch (err) {
    console.error('Reply email failed:', err)
  }

  res.json(sendSuccess({ message: 'Reply sent', isRead: true }))
})
