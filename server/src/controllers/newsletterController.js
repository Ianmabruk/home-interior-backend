import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const newsletterSchema = z.object({
  email: z.string().email(),
})

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = newsletterSchema.parse(req.body)

  const exists = await prisma.newsletterSubscription.findFirst({ where: { email } })
  if (exists) {
    return res.status(200).json({ message: 'Already subscribed' })
  }

  await prisma.newsletterSubscription.create({ data: { email } })
  res.status(201).json({ message: 'Subscribed successfully' })
})
