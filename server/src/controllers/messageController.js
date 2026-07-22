import { z } from 'zod'
import { supabase } from '../config/supabase.js'
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

  const { data: created, error } = await supabase
    .from('messages')
    .insert([payload])
    .single()

  if (error) throw new ApiError(500, error.message)
  res.status(201).json(sendSuccess(withId(created)))
})

export const createQuote = asyncHandler(async (req, res) => {
  const payload = parseBody(quoteSchema, req.body)
  const created = await supabase
    .from('messages')
    .insert([{
      name: payload.fullName,
      email: payload.email,
      subject: `Quote Request: ${payload.projectType}`,
      content: payload.message,
      is_read: false,
    }])
    .single()

  const { data: message } = created
  if (created.error) throw new ApiError(500, created.error.message)

  try {
    const { data: admin } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .single()

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

  res.status(201).json(sendSuccess(withId(message)))
})

export const listMessages = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200)
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, limit - 1)

  if (error) throw new ApiError(500, error.message)
  res.json(sendSuccess(withIdArray(data || [])))
})

export const replyToMessage = asyncHandler(async (req, res) => {
  const { messageId, reply } = parseBody(replySchema, req.body)
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single()

  if (messageError || !message) {
    return res.status(404).json({ message: 'Message not found' })
  }

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)

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
