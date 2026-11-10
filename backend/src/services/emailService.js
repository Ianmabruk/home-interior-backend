import nodemailer from 'nodemailer'
import * as brevo from '@getbrevo/brevo'
import { prisma, withTimeout } from '../config/database.js'
import { env } from '../config/env.js'

let brevoClient = null
let smtpTransport = null

function getBrevoClient() {
  if (brevoClient) return brevoClient
  const apiKey = env.brevoApiKey || process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || ''
  if (!apiKey) return null

  const client = new brevo.TransactionalEmailsApi()
  client.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)
  brevoClient = client
  return brevoClient
}

function getSmtpTransport() {
  if (smtpTransport) return smtpTransport
  // Password is read from the process environment at call time ONLY.
  // It is never stored on the env object, never logged, never serialized.
  const pass = process.env.SMTP_PASSWORD
  if (!pass) return null
  smtpTransport = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpSecure,
    auth: {
      user: env.email.smtpUser,
      pass,
    },
  })
  return smtpTransport
}

const SENDER = env.email.smtpFrom
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'info@hokinteriors.co.ke'
const siteName = (process.env.SITE_NAME) || 'HOK Interiors'
const frontendUrl = env.clientUrl || 'https://hokinteriors.co.ke'

// Escape untrusted text for safe inclusion in HTML (Phase 19).
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function trackUrl(path = '/track-order', params) {
  const url = new URL(frontendUrl)
  url.pathname = path
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }
  return url.toString()
}

function accountUrl() {
  return trackUrl('/my-account')
}

function logoUrl() {
  return `${frontendUrl.replace(/\/$/, '')}/hok-logo.png`
}

// Idempotency: record an email event attempt so the same logical event
// can never be sent twice (Phase 11). Only blocks retries when the status
// is 'sent' — 'failed' or 'queued' allow a retry attempt.
async function hasSent(eventId) {
  if (!eventId) return false
  try {
    const entry = await prisma.emailLog.findUnique({ where: { eventId } })
    if (!entry) return false
    // Allow retry if the previous attempt failed or was queued
    return entry.status === 'sent'
  } catch {
    return false
  }
}

async function recordSent({ eventId, recipient, recipientName, emailType, orderId, subject, provider, status, messageId, failureReason }) {
  if (!eventId) return null
  try {
    await prisma.emailLog.upsert({
      where: { eventId },
      update: { status, messageId, failureReason, sentAt: status === 'sent' ? new Date() : undefined },
      create: { eventId, recipient, recipientName, emailType, orderId, subject, provider, status, messageId, failureReason, sentAt: status === 'sent' ? new Date() : undefined },
    })
  } catch (e) {
    console.warn('[emailService] failed to write email log:', e?.message)
  }
  return null
}

async function sendViaBrevo({ to, name, subject, html, text }) {
  const client = getBrevoClient()
  if (!client) {
    return { sent: false, reason: 'not_configured' }
  }

  const senderEmail = env.brevoSenderEmail || process.env.BREVO_SENDER_EMAIL || env.email.smtpUser || SUPPORT_EMAIL
  const senderName = env.brevoSenderName || process.env.BREVO_SENDER_NAME || siteName || 'HOK Interiors'

  const payload = {
    to: [{ email: to, name: name || 'Customer' }],
    sender: { email: senderEmail, name: senderName },
    replyTo: { email: SUPPORT_EMAIL },
    subject,
    htmlContent: html,
    textContent: text || undefined,
  }

  const result = await client.sendTransacEmail(payload)
  const body = result?.body || result || {}

  return {
    sent: true,
    provider: 'brevo',
    messageId: body?.messageId || body?.headers?.['x-message-id'] || null,
  }
}

export async function sendRawEmail({ eventId, to, name, subject, html, text }) {
  if (!to) {
    return { skipped: true, reason: 'no_recipient' }
  }

  if (eventId) {
    const alreadySent = await hasSent(eventId).catch(() => false)
    if (alreadySent) {
      return { skipped: true, reason: 'already_sent' }
    }
  }

  let provider = 'none'
  let messageId = null
  let status = 'queued'
  let failureReason = null

  try {
    const brevoResult = await sendViaBrevo({ to, name, subject, html, text })
    if (brevoResult.sent) {
      provider = brevoResult.provider
      messageId = brevoResult.messageId
      status = 'sent'
    } else {
      const transport = getSmtpTransport()
      if (transport) {
        const info = await withTimeout(transport.sendMail({
          from: SENDER,
          to,
          subject,
          html,
          text,
          replyTo: SUPPORT_EMAIL,
        }), 10000)
        provider = 'smtp'
        messageId = info?.messageId || null
        status = 'sent'
      } else {
        console.warn('[emailService] No configured email provider available. Email not sent (dev mode).')
        provider = 'none'
        status = 'skipped'
        return { skipped: true, reason: brevoResult.reason || 'not_configured' }
      }
    }
  } catch (err) {
    console.error('[emailService] send failed:', err?.message || err)
    const transport = getSmtpTransport()
    if (transport) {
      try {
        const info = await withTimeout(transport.sendMail({
          from: SENDER,
          to,
          subject,
          html,
          text,
          replyTo: SUPPORT_EMAIL,
        }), 10000)
        provider = 'smtp'
        messageId = info?.messageId || null
        status = 'sent'
      } catch (smtpErr) {
        status = 'failed'
        failureReason = smtpErr?.message || err?.message || String(err)
        provider = 'smtp'
      }
    } else {
      status = 'failed'
      failureReason = err?.message || String(err)
      provider = 'brevo'
    }
  }

  recordSent({
    eventId,
    recipient: to,
    recipientName: name,
    emailType: subject,
    subject,
    provider,
    status,
    messageId,
    failureReason,
    orderId: null,
  }).catch(() => {})

  return { skipped: status === 'failed' || status === 'skipped' || status === 'queued', provider, messageId, status, failureReason }
}

function baseLayout({ title, children, unsubscribe }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf8f4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2a241f;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:24px;padding:28px;border:1px solid rgba(42,36,31,0.08);box-shadow:0 10px 40px rgba(42,36,31,0.06);">
       <div style="text-align:center;margin-bottom:18px;">
         <img src="${logoUrl()}" alt="HOK Interiors logo" width="200" height="56" style="display:block;margin:0 auto;width:200px;height:auto;border:0;" />
       </div>
      ${children}
      <div style="text-align:center;margin-top:24px;font-size:12px;color:#a89f91;">
        HOK Interiors · ${esc(SUPPORT_EMAIL)}
      </div>
      ${unsubscribe || ''}
    </div>
  </div>
</body>
</html>`
}

function ctaButton(label, href) {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;border-radius:9999px;background:#2a241f;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${esc(label)}</a>`
}

function plaintextBase({ title, lines }) {
  return `${title}\n\n${lines.join('\n').trim()}\n\nHOK Interiors\n${SUPPORT_EMAIL}\n${frontendUrl}`
}

export async function sendWelcomeEmail({ userId, email, name }) {
  const greetingName = name || 'there'
  const html = baseLayout({
    title: 'Welcome to HOK Interiors',
    children: `
      <h1 style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#2a241f;">Welcome to HOK Interiors, ${esc(greetingName)}</h1>
      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">We're delighted to have you with us. Your account has been successfully created.</p>
      <ul style="margin:0 0 24px;font-size:14px;color:#2a241f;line-height:1.6;padding-left:20px;">
        <li>Explore our collections</li>
        <li>Save your account information</li>
        <li>Place and track orders</li>
        <li>Stay connected with HOK Interiors</li>
      </ul>
      ${ctaButton('Go To My Account', accountUrl())}
      <p style="margin-top:18px;font-size:13px;color:#6b6055;">We look forward to helping you create spaces that feel like home.</p>
    `,
  })
  const text = plaintextBase({
    title: 'Welcome to HOK Interiors',
    lines: [
      `Welcome to HOK Interiors, ${greetingName}.`,
      "We're delighted to have you with us. Your account has been successfully created.",
      'You can now explore collections, save your info, place orders, and track them.',
      `Go to My Account: ${accountUrl()}`,
    ],
  })

  return sendRawEmail({
    eventId: `user_${String(userId || email)}_welcome`,
    to: email,
    name: greetingName,
    subject: `Welcome to HOK Interiors${name ? `, ${greetingName}` : ''}`,
    html,
    text,
  })
}

export async function sendLoginNotification({ userId, email, name }) {
  if (env.email.loginNotificationEnabled === false) {
    return { skipped: true, reason: 'disabled' }
  }
  const greetingName = name || 'there'
  const loginTime = new Date().toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  })
  const html = baseLayout({
    title: 'New Sign-In to Your HOK Interiors Account',
    children: `
      <h1 style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#2a241f;">New Sign-In to Your HOK Interiors Account</h1>
      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Hello ${esc(greetingName)},</p>
      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Your HOK Interiors account was successfully accessed on ${esc(loginTime)}.</p>
      <p style="margin:0 0 24px;font-size:15px;color:#2a241f;">If you don't recognize this activity, please secure your account immediately.</p>
      ${ctaButton('Go To My Account', accountUrl())}
    `,
  })
  const text = plaintextBase({
    title: 'New Sign-In to Your HOK Interiors Account',
    lines: [
      `Hello ${greetingName},`,
      `Your HOK Interiors account was successfully accessed on ${loginTime}.`,
      "If you don't recognize this activity, please secure your account immediately.",
      `Go to My Account: ${accountUrl()}`,
    ],
  })

  return sendRawEmail({
    eventId: `user_${String(userId || email)}_login_${new Date().toISOString().slice(0, 10)}`,
    to: email,
    name: greetingName,
    subject: 'New Sign-In to Your HOK Interiors Account',
    html,
    text,
  })
}

export async function sendOrderConfirmationEmail({ order, toEmail, siteName: overrideSiteName, supportEmail }) {
  const html = buildHtmlEmail({ order, siteName: overrideSiteName, supportEmail })
  const text = buildOrderTextEmail({ order, siteName: overrideSiteName, supportEmail })

  const orderId = order._id || order.id || ''
  return sendRawEmail({
    eventId: `order_${String(orderId)}_confirmation`,
    to: toEmail,
    name: order.name || 'Customer',
    subject: `Order Confirmation — ${order.trackingNumber || ''} — HOK Interiors`.replace(/\s+—\s+$/, ''),
    html,
    text,
  })
}

export async function sendOrderStatusUpdateEmail({ order, previousStatus, newStatus, toEmail, siteName: overrideSiteName, supportEmail }) {
  const html = buildStatusHtml({ order, newStatus, previousStatus, siteName: overrideSiteName, supportEmail })
  const text = buildStatusText({ order, newStatus, siteName: overrideSiteName })

  const orderId = order._id || order.id || ''
  return sendRawEmail({
    eventId: `order_${String(orderId)}_status_${String(newStatus || 'updated')}`,
    orderId,
    to: toEmail,
    name: order.name || 'Customer',
    subject: `HOK Interiors Order Update — Status: ${newStatus || 'Updated'}`,
    html,
    text,
  })
}

export async function sendNewsletterNotificationEmail({ subscriberEmail, siteName: overrideSiteName, supportEmail }) {
  const html = buildNewsletterNotificationHtml({ subscriberEmail, siteName: overrideSiteName, supportEmail: supportEmail || SUPPORT_EMAIL })
  const text = plaintextBase({
    title: 'New HOK Interiors Mailing List Subscription',
    lines: [`A new subscriber has joined the HOK Interiors mailing list: ${subscriberEmail}`],
  })
  return sendRawEmail({
    eventId: `newsletter_notification_${String(subscriberEmail)}_${new Date().toISOString().slice(0, 10)}`,
    to: supportEmail || SUPPORT_EMAIL,
    name: overrideSiteName || siteName,
    subject: `New mailing list subscription from ${subscriberEmail} — HOK Interiors`,
    html,
    text,
  })
}

export async function sendMailingListWelcomeEmail({ subscriberEmail, unsubscribeToken, siteName: overrideSiteName, supportEmail }) {
  const sn = overrideSiteName || siteName
  const se = supportEmail || SUPPORT_EMAIL
  const unsubscribeUrl = unsubscribeToken
    ? trackUrl(`/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`)
    : trackUrl('/unsubscribe')

  const html = baseLayout({ title: 'Welcome to the HOK Journal', children: `
    <h1 style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#2a241f;">Welcome to the HOK Journal</h1>
    <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Thank you for joining the HOK Interiors community.</p>
    <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">You'll now receive updates about new collections, design inspiration, projects, and special announcements from HOK Interiors.</p>
    ${ctaButton('Visit HOK Interiors', frontendUrl)}
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#a89f91;">
      <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer" style="color:#a89f91;text-decoration:underline;">Unsubscribe</a>
    </div>
  `, unsubscribe: `<div style="text-align:center;font-size:12px;color:#a89f91;">You're receiving this because you subscribed at ${frontendUrl}. <a href="${unsubscribeUrl}" rel="noopener noreferrer" style="color:#a89f91;text-decoration:underline;">Unsubscribe</a> at any time.</div>` })

  const text = plaintextBase({
    title: 'Welcome to the HOK Journal — HOK Interiors',
    lines: [
      'Thank you for joining the HOK Interiors community.',
      "You'll now receive updates about new collections, design inspiration, projects, and special announcements.",
      '',
      `Visit HOK Interiors: ${frontendUrl}`,
      `Unsubscribe: ${unsubscribeUrl}`,
    ],
  })

  return sendRawEmail({
    eventId: `subscriber_welcome_${String(subscriberEmail)}`,
    to: subscriberEmail,
    subject: 'Welcome to the HOK Journal — HOK Interiors',
    html,
    text,
  })
}

// ---- HTML builders (reuse existing branded look) ----

function buildHtmlEmail({ order, siteName: overrideSiteName, supportEmail: overrideSupport }) {
  const sn = overrideSiteName || siteName
  const se = overrideSupport || SUPPORT_EMAIL
  const trackingUrl = trackUrl('/track-order', { tracking: order.trackingNumber || '' })
  const shopUrl = trackUrl('/shop')
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
  const formattedDate = orderDate.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  })

  const paymentInstructions = `
    <div style="margin-top:24px;padding:16px;background:#faf8f4;border-radius:16px;border:1px solid rgba(42,36,31,0.08);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;margin-bottom:10px;">Payment Instructions</div>
      <p style="margin:0 0 12px;font-size:14px;color:#2a241f;">Please complete payment to confirm your order.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;padding:12px 16px;">
        <tr>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Business Number</div>
            <div style="font-size:16px;color:#2a241f;margin-top:6px;font-weight:700;">0723057487</div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Payment Reference</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">Use your order number: #${esc(String(order._id || order.id || '').slice(-8).toUpperCase())}</div>
          </td>
        </tr>
      </table>
    </div>
  `

  return baseLayout({ title: 'Order Confirmation', children: `
    <h1 style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#2a241f;">YOUR ORDER IS CONFIRMED</h1>
    <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Thank you for your order, ${esc(order.name || 'valued customer')}.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f4;border-radius:16px;padding:14px 16px;margin-bottom:18px;">
      <tr>
        <td style="width:50%;padding:8px 12px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Order</div>
          <div style="font-size:14px;color:#2a241f;margin-top:6px;">#${esc(String(order._id || order.id || '').slice(-8).toUpperCase())}</div>
        </td>
        <td style="width:50%;padding:8px 12px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Date</div>
          <div style="font-size:14px;color:#2a241f;margin-top:6px;">${formattedDate}</div>
        </td>
      </tr>
      <tr>
        <td style="width:50%;padding:8px 12px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Status</div>
          <div style="font-size:14px;color:#2a241f;margin-top:6px;text-transform:capitalize;">${esc(order.status || 'Pending')}</div>
        </td>
        <td style="width:50%;padding:8px 12px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Tracking</div>
          <div style="font-size:14px;color:#e89a43;margin-top:6px;font-weight:700;">${esc(order.trackingNumber || 'N/A')}</div>
        </td>
      </tr>
    </table>
    <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;margin-bottom:10px;">Products</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${buildItemRowsHtml(order.items)}
    </table>
    <hr style="border:0;border-top:1px solid #f0ebe3;margin:18px 0;" />
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6b6055;">Subtotal</td>
        <td style="padding:6px 0;font-size:13px;color:#2a241f;text-align:right;font-weight:600;">KSh ${(Number(order.total || 0)).toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6b6055;">Shipping</td>
        <td style="padding:6px 0;font-size:13px;color:#2a241f;text-align:right;font-weight:600;">Free</td>
      </tr>
      <tr>
        <td style="font-size:16px;color:#2a241f;font-weight:700;padding-top:10px;">Total</td>
        <td style="font-size:16px;color:#2a241f;font-weight:700;text-align:right;padding-top:10px;">KSh ${(Number(order.total || 0)).toLocaleString()}</td>
      </tr>
    </table>
    ${paymentInstructions || ''}
    <div style="text-align:center;margin-top:24px;">
      ${ctaButton('Track Your Order', trackingUrl)}
    </div>
    <div style="text-align:center;margin-top:12px;">
     <a href="${shopUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 22px;border-radius:9999px;background:#ffffff;color:#2a241f;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(42,36,31,0.15);">Continue Shopping</a>
      </div>
    `, unsubscribe: '' })
 }

function buildItemRowsHtml(items) {
  const safeItems = Array.isArray(items) ? (typeof items === 'string' ? (() => { try { return JSON.parse(items) } catch { return [] } })() : items) : []
  return safeItems.map((item) => {
    const imageUrl = item.image || item.selectedVariant?.image || ''
    const name = item.name || item.productName || 'Product'
    const qty = Number(item.quantity || 1)
    const unitPrice = Number(item.price || item.discountPrice || 0)
    const total = unitPrice * qty
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f0ebe3;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:72px;vertical-align:top;">
                ${imageUrl ? `<img src="${imageUrl}" alt="${esc(name)}" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:12px;object-fit:cover;background:#f0ebe3;" />` : `<div style="width:64px;height:64px;border-radius:12px;background:#f0ebe3;color:#a89f91;text-align:center;line-height:64px;font-size:11px;">No img</div>`}
              </td>
              <td style="padding-left:14px;vertical-align:top;">
                <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#2a241f;font-weight:600;">${esc(name)}</div>
                ${item.selectedVariant?.color ? `<div style="font-family:system-ui,sans-serif;font-size:12px;color:#8b5e3c;margin-top:4px;">Variant: ${esc(item.selectedVariant.color)}</div>` : ''}
                <div style="font-family:system-ui,sans-serif;font-size:12px;color:#6b6055;margin-top:6px;">Qty: ${qty}</div>
              </td>
              <td style="text-align:right;vertical-align:top;white-space:nowrap;">
                <div style="font-family:system-ui,sans-serif;font-size:14px;color:#2a241f;font-weight:600;">KSh ${total.toLocaleString()}</div>
                <div style="font-family:system-ui,sans-serif;font-size:11px;color:#a89f91;margin-top:4px;">${unitPrice.toLocaleString()} each</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')
}

function buildOrderTextEmail({ order, siteName: overrideSiteName, supportEmail }) {
  const sn = overrideSiteName || siteName
  const se = supportEmail || SUPPORT_EMAIL
  const trackingUrl = trackUrl('/track-order', { tracking: order.trackingNumber || '' })
  const items = Array.isArray(order.items) ? (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items) } catch { return [] } })() : order.items) : []
  const lines = [
    `YOUR ORDER IS CONFIRMED`,
    `Thank you for your order, ${order.name || 'valued customer'}.`,
    '',
    `Order: #${String(order._id || order.id || '').slice(-8).toUpperCase()}`,
    `Status: ${order.status || 'Pending'}`,
    `Tracking: ${order.trackingNumber || 'N/A'}`,
    '',
    'Items:',
    ...items.map((i) => `  - ${i.name || 'Product'} x ${Number(i.quantity || 1)} @ KSh ${Number(i.price || 0).toLocaleString()}`),
    '',
    `Subtotal: KSh ${(Number(order.total || 0)).toLocaleString()}`,
    `Shipping: Free`,
    `TOTAL: KSh ${(Number(order.total || 0)).toLocaleString()}`,
    '',
    `Track Your Order: ${trackingUrl}`,
    `Continue Shopping: ${trackUrl('/shop')}`,
  ]
  return plaintextBase({ title: sn, lines })
}

function statusLabel(status) {
  return String(status || 'pending').replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildStatusHtml({ order, newStatus, previousStatus, siteName: overrideSiteName, supportEmail: overrideSupport }) {
  const sn = overrideSiteName || siteName
  const se = overrideSupport || SUPPORT_EMAIL
  const trackingUrl = trackUrl('/track-order', { tracking: order.trackingNumber || '' })
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
  const formattedDate = orderDate.toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' })
  return baseLayout({ title: 'Order Status Update', children: `
    <h1 style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#2a241f;">Order Update — ${sn}</h1>
    <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Hello ${esc(order.name || 'valued customer')},</p>
    <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Your order status has been updated.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f4;border-radius:16px;padding:14px 16px;margin-bottom:18px;">
      <tr>
        <td style="width:50%;padding:8px 12px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Order</div>
          <div style="font-size:14px;color:#2a241f;margin-top:6px;">#${esc(String(order._id || order.id || '').slice(-8).toUpperCase())}</div>
        </td>
        <td style="width:50%;padding:8px 12px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Tracking</div>
          <div style="font-size:14px;color:#e89a43;margin-top:6px;font-weight:700;">${esc(order.trackingNumber || 'N/A')}</div>
        </td>
      </tr>
      <tr>
        <td style="width:50%;padding:8px 12px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Previous Status</div>
          <div style="font-size:14px;color:#2a241f;margin-top:6px;">${esc(statusLabel(previousStatus))}</div>
        </td>
        <td style="width:50%;padding:8px 12px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Current Status</div>
          <div style="font-size:14px;color:#e89a43;margin-top:6px;font-weight:700;">${esc(statusLabel(newStatus))}</div>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin-top:24px;">
      ${ctaButton('Track Your Order', trackingUrl)}
     </div>
    <p style="margin-top:18px;font-size:12px;color:#6b6055;">Order placed on ${formattedDate}.</p>
   `, unsubscribe: '' })
  }

function buildStatusText({ order, newStatus }) {
  const trackingUrl = trackUrl('/track-order', { tracking: order.trackingNumber || '' })
  return plaintextBase({
    title: 'Order Status Update — HOK Interiors',
    lines: [
      `Hello ${order.name || 'valued customer'},`,
      'Your order status has been updated.',
      '',
      `Order: #${String(order._id || order.id || '').slice(-8).toUpperCase()}`,
      `Tracking: ${order.trackingNumber || 'N/A'}`,
      `Current Status: ${statusLabel(newStatus)}`,
      '',
      `Track Your Order: ${trackingUrl}`,
    ],
  })
}

function buildNewsletterNotificationHtml({ subscriberEmail, siteName: overrideSiteName, supportEmail }) {
  const sn = overrideSiteName || siteName
  const se = supportEmail || SUPPORT_EMAIL
  const formattedDate = new Date().toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  })
  return baseLayout({
    title: sn,
    children: `
      <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;margin-bottom:16px;">New Subscription Notification</div>
      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">A new subscriber has joined the HOK Interiors mailing list.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f4;border-radius:16px;padding:14px 16px;margin-bottom:18px;">
        <tr>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Subscriber Email</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;word-break:break-all;">${esc(subscriberEmail)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Subscribed At</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">${esc(formattedDate)}</div>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:18px;font-size:12px;color:#a89f91;">
        ${esc(sn)} · Need help? Contact us at ${esc(se)}
      </div>
    `,
  })
}

function buildTrackingHtml({ order, siteName: overrideSiteName, supportEmail: overrideSupport }) {
  const sn = overrideSiteName || siteName
  const trackingUrl = trackUrl('/track-order', { tracking: order.trackingNumber || '' })
  const tracking = order.trackingNumber || 'N/A'
  const statusLabel = (order.status || 'pending').charAt(0).toUpperCase() + String(order.status || 'pending').slice(1)
  return baseLayout({
    title: 'Track Your HOK Order',
    children: `
      <h1 style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#2a241f;">Track Your Order</h1>
      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Hello ${esc(order.name || 'there')},</p>
      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Track the status of your HOK Interiors order using the details below.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f4;border-radius:16px;padding:14px 16px;margin-bottom:18px;">
        <tr>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Order</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">#${esc(String(order._id || order.id || '').slice(-8).toUpperCase())}</div>
          </td>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Tracking</div>
            <div style="font-size:14px;color:#e89a43;margin-top:6px;font-weight:700;">${esc(tracking)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Status</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">${esc(statusLabel)}</div>
          </td>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Date</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">${esc(new Date(order.createdAt || new Date()).toLocaleDateString('en-KE', { dateStyle: 'medium' }))}</div>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Track This Order', trackingUrl)}
      </div>
      <p style="margin-top:18px;font-size:13px;color:#6b6055;">
        Keep this order reference handy: ${esc(tracking)}. You can return to this page anytime to check your order's progress.
      </p>
    `,
  })
}

function buildConsultationHtml({ consultation, siteName: overrideSiteName, supportEmail: overrideSupport }) {
  const sn = overrideSiteName || siteName
  const se = supportEmail || SUPPORT_EMAIL
  const contactUrl = trackUrl('/contact')
  return baseLayout({
    title: 'HOK Interiors — Consultation Received',
    children: `
      <h1 style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#2a241f;">Thank You for Reaching Out</h1>
      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Hello ${esc(consultation.name || 'there')},</p>
      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">We have received your consultation request and one of our design consultants will contact you within 24 hours to discuss your project.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f4;border-radius:16px;padding:14px 16px;margin-bottom:18px;">
        <tr>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Service</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">${esc(consultation.projectType || consultation.type || '—')}</div>
          </td>
          <td style="padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Reference</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">${esc(String(consultation.id || '').slice(-8).toUpperCase())}</div>
          </td>
        </tr>
      </table>
      ${ctaButton('Visit HOK Interiors', frontendUrl)}
      <div style="text-align:center;margin-top:24px;font-size:12px;color:#a89f91;">
        Have questions? Reply to this email or contact us at ${esc(se)}.
      </div>
    `,
  })
}

export async function sendOrderTrackingEmail({ order, toEmail, siteName: overrideSiteName, supportEmail }) {
  const orderId = order._id || order.id || ''
  const html = buildTrackingHtml({ order, siteName: overrideSiteName, supportEmail })
  const text = plaintextBase({
    title: 'Track Your HOK Order',
    lines: [
      `Hello ${order.name || 'there'},`,
      'Track the status of your HOK Interiors order.',
      '',
      `Order: #${String(orderId).slice(-8).toUpperCase()}`,
      `Tracking: ${order.trackingNumber || 'N/A'}`,
      '',
      `Track This Order: ${trackUrl('/track-order', { tracking: order.trackingNumber || '' })}`,
    ],
  })
  return sendRawEmail({
    eventId: `order_${String(orderId)}_tracking`,
    to: toEmail,
    name: order.name || 'Customer',
    subject: `Track Your HOK Order — ${order.trackingNumber || '#'+String(orderId).slice(-8).toUpperCase()}`,
    html,
    text,
  })
}

export async function sendConsultationConfirmationEmail({ consultation, toEmail, siteName: overrideSiteName, supportEmail }) {
  const id = consultation.id || consultation._id || ''
  const html = buildConsultationHtml({ consultation, siteName: overrideSiteName, supportEmail })
  const text = plaintextBase({
    title: 'HOK Interiors — Consultation Received',
    lines: [
      `Hello ${consultation.name || 'there'},`,
      'We have received your consultation request. A design consultant will contact you within 24 hours.',
      '',
      `Reference: #${String(id).slice(-8).toUpperCase()}`,
      `Visit HOK Interiors: ${frontendUrl}`,
    ],
  })
  return sendRawEmail({
    eventId: `consultation_${String(id)}_confirmation`,
    to: toEmail,
    name: consultation.name || 'Customer',
    subject: 'HOK Interiors — We received your consultation request',
    html,
    text,
  })
}

export default {
  sendWelcomeEmail,
  sendLoginNotification,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendOrderTrackingEmail,
  sendConsultationConfirmationEmail,
  sendNewsletterNotificationEmail,
  sendMailingListWelcomeEmail,
  getSmtpTransport,
  sendRawEmail,
}

export const emailService = {
  sendWelcomeEmail,
  sendLoginNotification,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendOrderTrackingEmail,
  sendConsultationConfirmationEmail,
  sendNewsletterNotificationEmail,
  sendMailingListWelcomeEmail,
  getSmtpTransport,
  sendRawEmail,
}
