import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { parseBody } from '../utils/helpers.js'
import { prismaSafeWrite } from '../utils/prismaSafeWrite.js'
import { sendEmail } from '../config/sendgrid.js'

const newsletterSchema = z.object({
  email: z.string().email(),
})

const sendNewsletterSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
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

export const listNewsletterAdmin = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500)
  const items = await prisma.newsletterSubscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(sendSuccess(items.map((n) => ({ ...n, _id: n.id }))))
})

export const deleteNewsletter = asyncHandler(async (req, res) => {
  const existing = await prisma.newsletterSubscription.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new ApiError(404, 'Subscriber not found')
  await prisma.newsletterSubscription.delete({ where: { id: req.params.id } })
  res.json(sendSuccess({ message: 'Subscriber removed' }))
})

export const sendNewsletter = asyncHandler(async (req, res) => {
  const { subject, message } = parseBody(sendNewsletterSchema, req.body)

  const subscribers = await prisma.newsletterSubscription.findMany({
    where: { isActive: true },
    select: { email: true },
  })

  if (subscribers.length === 0) {
    return res.status(200).json(sendSuccess({ message: 'No active subscribers', sent: 0 }))
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${subject}</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background-color: #FAF8F4; color: #2B2B2B; }
          .container { max-width: 640px; margin: 0 auto; padding: 40px 24px; }
          .logo { font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 600; color: #1F4D3A; letter-spacing: 0.05em; }
          .brand { font-family: 'Inter', system-ui, sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.25em; color: #B88A5A; margin-top: 2px; }
          .header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #EDE7DE; }
          .title { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1F4D3A; margin: 24px 0 12px; }
          .body-text { font-size: 15px; line-height: 1.8; color: #2B2B2B; }
          .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #EDE7DE; font-size: 12px; color: #8B7355; }
          .accent-line { width: 40px; height: 2px; background: #B88A5A; margin: 16px 0; }
          a { color: #1F4D3A; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">HOK</div>
            <div class="brand">Interior Designs</div>
          </div>
          <div class="accent-line"></div>
          <h1 class="title">${subject}</h1>
          <div class="body-text">${message.replace(/\n/g, '<br>')}</div>
          <div class="footer">
            <p>HOK Interior Designs</p>
            <p>Creating elegant interiors that blend comfort, beauty, and functionality.</p>
            <p style="margin-top: 8px;"><a href="https://hokinteriors.com">hokinteriors.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  const promises = subscribers.map((sub) =>
    sendEmail({
      to: sub.email,
      subject,
      html,
    }).catch((err) => {
      console.error(`[newsletter] failed to send to ${sub.email}:`, err)
      return { success: false, email: sub.email }
    }),
  )

  const results = await Promise.allSettled(promises)
  const sent = results.filter((r) => r.status === 'fulfilled' && r.value?.sent).length
  const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.sent)).length

  res.json(sendSuccess({ message: `Newsletter sent to ${sent} subscribers (${failed} failed)`, sent, failed, total: subscribers.length }))
})

export const newsletterController = {
  subscribeNewsletter,
  listNewsletterAdmin,
  deleteNewsletter,
  sendNewsletter,
}