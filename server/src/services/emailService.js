import sgMail from '@sendgrid/mail'
import { env } from '../config/env.js'

sgMail.setApiKey(env.sendgridApiKey)

const MAX_ATTEMPTS = 3
const retryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 8000)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const emailService = {
  async send({ to, from, subject, text, html }) {
    if (!env.sendgridApiKey) {
      console.warn('[EMAIL] SENDGRID_API_KEY not configured — email not sent')
      return { skipped: true, reason: 'SENDGRID_API_KEY missing' }
    }

    const payload = {
      to,
      from: from || env.seedAdminEmail,
      subject,
      text,
      html,
    }

    let lastError
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await sgMail.send(payload)
        console.log(`[EMAIL] Sent to ${to} (attempt ${attempt})`, { subject, messageId: result[0]?.headers?.['x-message-id'] })
        return { success: true, result }
      } catch (error) {
        lastError = error
        const status = error?.response?.status
        const body = error?.response?.body || {}
        console.error(`[EMAIL] Send attempt ${attempt} failed for ${to}:`, { status, subject, errors: body.errors || error.message })

        if (status === 401 || status === 400) {
          break
        }
        if (attempt < MAX_ATTEMPTS) {
          await sleep(retryDelay(attempt))
        }
      }
    }

    console.error('[EMAIL] All send attempts failed:', { to, subject, error: lastError?.message || lastError })
    return { success: false, error: lastError }
  },
}

export default emailService
