import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'

const newsletterSchema = z.object({
  email: z.string().email(),
})

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = parseBody(newsletterSchema, req.body)

  const exists = await prisma.newsletterSubscription.findFirst({ where: { email } })
  if (exists) {
    return res.status(200).json(sendSuccess({ message: 'Already subscribed' }))
  }

  await prismaSafeWrite(
    (data) => prisma.newsletterSubscription.create({ data }),
    { email },
    'NEWSLETTER][SUBSCRIBE',
  )
  res.status(201).json(sendSuccess({ message: 'Subscribed successfully' }))
})
