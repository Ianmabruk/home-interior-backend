import { asyncHandler } from '../middleware/asyncHandler.js'
import { messageService } from '../services/messageService.js'
import { failure } from '../utils/response.js'

export const messageController = {
  list: asyncHandler(async (req, res) => {
    const items = await messageService.listMessages()
    res.json({ success: true, data: items })
  }),

  create: asyncHandler(async (req, res) => {
    const data = {
      name: req.body.name || '',
      email: req.body.email || '',
      subject: req.body.subject || '',
      content: req.body.content || '',
    }
    const message = await messageService.createMessage(data)
    res.status(201).json({ success: true, data: message })
  }),

  reply: asyncHandler(async (req, res) => {
    const id = req.body.messageId || req.body.id || req.params.id
    const item = await messageService.replyToMessage(id, req.body.reply)
    res.json({ success: true, data: item })
  }),
}
