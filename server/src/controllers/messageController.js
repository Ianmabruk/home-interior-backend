import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseBody } from '../utils/helpers.js'
import { env } from '../config/env.js'
import { emailService } from '../services/emailService.js'

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
  const created = await prisma.message.create({ data: payload })
  res.status(201).json(sendSuccess(withId(created)))
})

export const createQuote = asyncHandler(async (req, res) => {
  const payload = parseBody(quoteSchema, req.body)
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
      void emailService.send({
        to: admin.email,
        subject: `New Quote Request: ${payload.projectType}`,
        text: `Full Name: ${payload.fullName}\nEmail: ${payload.email}\nProject Type: ${payload.projectType}\nBudget: ${payload.budget}\nMessage: ${payload.message}`,
        html: `<p><strong>Full Name:</strong> ${payload.fullName}</p><p><strong>Email:</strong> ${payload.email}</p><p><strong>Project Type:</strong> ${payload.projectType}</p><p><strong>Budget:</strong> ${payload.budget}</p><p><strong>Message:</strong> ${payload.message}</p>`,
      })
    }
  } catch {
    // ignore
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

  await prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
  })

  try {
    if (message.email) {
      void emailService.send({
        to: message.email,
        subject: `Re: ${message.subject}`,
        text: reply,
        html: `<p>${reply.replace(/\n/g, '</p><p>')}</p>`,
      })
    }
  } catch {
    // ignore
  }

  res.json(sendSuccess({ message: 'Reply sent', isRead: true }))
})
