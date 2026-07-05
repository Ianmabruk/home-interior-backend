import { z } from 'zod'
import { Message } from '../models/Message.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const messageSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  content: z.string().min(10),
})

export const createMessage = asyncHandler(async (req, res) => {
  const payload = messageSchema.parse(req.body)
  const created = await Message.create(payload)
  res.status(201).json(created)
})

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({}).sort({ createdAt: -1 })
  res.json(messages)
})

export const replyToMessage = asyncHandler(async (req, res) => {
  const { messageId, reply } = req.body
  const message = await Message.findById(messageId)
  if (!message) {
    return res.status(404).json({ message: 'Message not found' })
  }
  message.isRead = true
  await message.save()
  // In production, this would send an email reply
  res.json({ message: 'Reply sent', isRead: true })
})