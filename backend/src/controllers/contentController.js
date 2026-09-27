import { asyncHandler } from '../middleware/asyncHandler.js'
import { homepageService } from '../services/homepageService.js'
import { sendNewsletterNotificationEmail, sendMailingListWelcomeEmail } from '../services/emailService.js'
import { prisma } from '../config/database.js'

export const contentController = {
  homepage: asyncHandler(async (req, res) => {
    const data = await homepageService.getHomepage()
    res.json({ success: true, data })
  }),

  newsletter: asyncHandler(async (req, res) => {
    const { email } = req.body

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    })

    const isNewSubscriber = !existing || existing.subscribed === false

    let subscriber = await prisma.subscriber.upsert({
      where: { email: normalizedEmail },
      update: { subscribed: true },
      create: {
        email: normalizedEmail,
        subscribed: true,
        unsubscribeToken: crypto
          .randomUUID()
          .replace(/-/g, '')
          .slice(0, 12),
      },
    })

    // Mailing-list welcome email to the subscriber (first subscribe or re-subscribe).
    if (isNewSubscriber) {
      sendMailingListWelcomeEmail({
        subscriberEmail: normalizedEmail,
        unsubscribeToken: subscriber.unsubscribeToken,
      }).catch((err) => {
        console.error('[newsletter] Failed to send welcome email:', err?.message || err)
      })
    }

    if (!existing) {
      const supportEmailSetting = await prisma.siteSetting.findUnique({
        where: { key: 'supportEmail' },
      })
      const recipientEmail = (process.env.SUPPORT_EMAIL || supportEmailSetting?.value || 'info@hokinteriors.co.ke').trim()

      const siteNameSetting = await prisma.siteSetting.findUnique({
        where: { key: 'siteName' },
      })
      // `siteName` is not defined in this scope. Referring to it threw a
      // ReferenceError, so the first newsletter signup against a database with
      // no `siteName` SiteSetting row returned HTTP 500.
      const notificationSiteName = siteNameSetting?.value || 'HOK Interiors'

      sendNewsletterNotificationEmail({
        subscriberEmail: normalizedEmail,
        siteName: notificationSiteName,
        supportEmail: recipientEmail,
      }).catch((err) => {
        console.error('[newsletter] Failed to send notification email:', err?.message || err)
      })
    }

    res.json({
      success: true,
      data: {
        message: isNewSubscriber ? 'Subscribed successfully' : 'already_subscribed',
        newSubscriber: isNewSubscriber,
      },
    })
  }),

  unsubscribe: asyncHandler(async (req, res) => {
    const { token } = req.query
    const normalizedToken = String(token || '').trim()
    if (!normalizedToken) {
      return res.status(400).json({ success: false, message: 'Unsubscribe token is required' })
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: normalizedToken },
    })

    if (!subscriber) {
      // Do not reveal whether a token exists (avoid enumeration).
      return res.json({ success: true, data: { message: 'Subscription preferences updated' } })
    }

    await prisma.subscriber.update({
      where: { unsubscribeToken: normalizedToken },
      data: { subscribed: false, updatedAt: new Date() },
    })

    res.json({ success: true, data: { message: 'You have been unsubscribed from marketing emails' } })
  }),
}
