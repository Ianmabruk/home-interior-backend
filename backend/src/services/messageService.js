import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

function mapMessage(item) {
  if (!item) return null
  return {
    ...item,
    id: item.id,
    isRead: item.isRead,
    createdAt: item.createdAt,
  }
}

export const messageService = {
  listMessages,
  getMessage,
  createMessage,
  replyToMessage,
  markMessageRead,
  deleteMessage,
}

async function listMessages() {
  const items = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return items.map(mapMessage)
}

async function getMessage(id) {
  const item = await prisma.message.findUnique({ where: { id } })
  if (!item) throw failure(404, 'Message not found')
  return mapMessage(item)
}

async function createMessage(data) {
  const message = await prisma.message.create({ data })
  return mapMessage(message)
}

async function replyToMessage(id, reply) {
  const item = await prisma.message.update({
    where: { id },
    data: { reply, isRead: true },
  })
  return mapMessage(item)
}

async function markMessageRead(id) {
  const item = await prisma.message.update({
    where: { id },
    data: { isRead: true },
  })
  return mapMessage(item)
}

async function deleteMessage(id) {
  const existing = await prisma.message.findUnique({ where: { id } })
  if (!existing) throw failure(404, 'Message not found')
  await prisma.message.delete({ where: { id } })
}
