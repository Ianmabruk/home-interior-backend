import sgMail from '@sendgrid/mail'
import { env } from './env.js'

if (env.sendGridApiKey) {
  sgMail.setApiKey(env.sendGridApiKey)
}

export const sendEmail = async ({ to, subject, html }) => {
  if (!env.sendGridApiKey) {
    return { sent: false, reason: 'SENDGRID_API_KEY is not configured' }
  }

  try {
    await sgMail.send({
      to,
      from: env.emailFrom,
      subject,
      html,
    })
    return { sent: true }
  } catch (err) {
    // Never let a SendGrid failure break the calling flow (login, register,
    // forgot-password, admin test email). A 401 here means the API key is
    // invalid/unauthorized — log it clearly but return a structured result so
    // the endpoint can still succeed and the client gets a clean response.
    const status = err?.code || err?.response?.statusCode
    const reason =
      status === 401
        ? 'SendGrid Unauthorized (401) — check SENDGRID_API_KEY'
        : (err?.message || 'SendGrid send failed')
    console.error('[SENDGRID] email not sent:', reason)
    return { sent: false, reason, status }
  }
}

export const buildAdminTestEmailTemplate = ({ adminEmail, timestamp }) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f7f4ef; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg, #111111 0%, #2a2a2a 100%); color:#ffffff; padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:26px; letter-spacing:0.1em; font-weight:300;">HOK</h1>
          <p style="margin:6px 0 0; color:#c25b3f; font-size:11px; letter-spacing:0.25em; text-transform:uppercase;">Interior Designs</p>
        </div>
        <div style="padding:32px; color:#252525;">
          <p style="margin:0 0 16px; font-size:15px; line-height:1.6;">This confirms your SendGrid integration is active and ready to send transactional emails.</p>
          <table style="width:100%; border-collapse:collapse; margin:20px 0; border-radius:12px; overflow:hidden; border:1px solid #e8e1d5;">
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em; width:40%;">Admin</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${adminEmail}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Timestamp</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Status</td>
              <td style="padding:12px 16px; font-size:14px; color:#16a34a; font-weight:600;">Delivered</td>
            </tr>
          </table>
          <p style="margin:0; font-size:12px; color:#8a7f70; line-height:1.6;">If this message was unexpected, review Admin access and API keys immediately. Contact support if you need assistance.</p>
        </div>
        <div style="padding:20px 32px; text-align:center; border-top:1px solid #e8e1d5;">
          <p style="margin:0; font-size:11px; color:#b8a99a; letter-spacing:0.05em;">HOK Interior Designs &mdash; Timeless spaces, elevated living.</p>
        </div>
      </div>
    </div>
  `
}

export const buildWelcomeEmailTemplate = ({ fullName, email }) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f7f4ef; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg, #111111 0%, #2a2a2a 100%); color:#ffffff; padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:26px; letter-spacing:0.1em; font-weight:300;">HOK</h1>
          <p style="margin:6px 0 0; color:#d97706; font-size:11px; letter-spacing:0.25em; text-transform:uppercase;">Welcome</p>
        </div>
        <div style="padding:32px; color:#252525;">
          <p style="margin:0 0 16px; font-size:18px; line-height:1.6;">Welcome, ${fullName}!</p>
          <p style="margin:0 0 16px; font-size:15px; line-height:1.6;">Your account has been successfully created with email: <strong>${email}</strong>.</p>
          <p style="margin:0 0 16px; font-size:15px; line-height:1.6;">You can now browse our curated collections, save items to your wishlist, and enjoy a seamless shopping experience.</p>
          <a href="${env.clientUrl}" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#d97706; color:#ffffff; text-decoration:none; font-size:12px; letter-spacing:0.1em; text-transform:uppercase; border-radius:4px;">Shop Now</a>
        </div>
        <div style="padding:20px 32px; text-align:center; border-top:1px solid #e8e1d5;">
          <p style="margin:0; font-size:11px; color:#b8a99a;">HOK Interior Designs — Timeless spaces, elevated living.</p>
        </div>
      </div>
    </div>
  `
}

export const buildLoginEmailTemplate = ({ fullName, email, timestamp }) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f7f4ef; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:#111111; color:#ffffff; padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:26px; letter-spacing:0.1em;">Login Alert</h1>
        </div>
        <div style="padding:32px; color:#252525;">
          <p style="margin:0 0 16px; font-size:15px;">Hello ${fullName},</p>
          <p style="margin:0 0 16px; font-size:15px;">Your account was accessed on ${new Date(timestamp).toLocaleString()}.</p>
          <p style="margin:0; font-size:15px;">If this wasn't you, please secure your account.</p>
        </div>
        <div style="padding:20px 32px; text-align:center; border-top:1px solid #e8e1d5;">
          <p style="margin:0; font-size:11px; color:#b8a99a;">HOK Interior Designs</p>
        </div>
      </div>
    </div>
  `
}

export const buildNewProductEmailTemplate = ({ productName, productPrice, productImageUrl }) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f7f4ef; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:#111111; color:#ffffff; padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:26px; letter-spacing:0.1em;">New Product Added</h1>
        </div>
        <div style="padding:32px; color:#252525;">
          <p style="margin:0 0 16px; font-size:15px;">A new product has been added to the store:</p>
          <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <tr>
              <td style="padding:12px; border:1px solid #e8e1d5; text-align:center;">
                ${productImageUrl ? `<img src="${productImageUrl}" alt="${productName}" style="max-width:100%; height:auto; border-radius:8px;" />` : ''}
                <p style="margin:12px 0 0; font-size:18px; font-weight:600;">${productName}</p>
                <p style="margin:4px 0 0; color:#d97706; font-size:16px;">$${productPrice}</p>
              </td>
            </tr>
          </table>
        </div>
        <div style="padding:20px 32px; text-align:center; border-top:1px solid #e8e1d5;">
          <p style="margin:0; font-size:11px; color:#b8a99a;">HOK Admin Dashboard</p>
        </div>
      </div>
    </div>
  `
}

export const buildQuoteEmailTemplate = ({ fullName, email, projectType, budget, message }) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f7f4ef; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:#111111; color:#ffffff; padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:26px; letter-spacing:0.1em;">New Quote Request</h1>
        </div>
        <div style="padding:32px; color:#252525;">
          <p style="margin:0 0 16px; font-size:15px;">You have received a new quote request:</p>
          <table style="width:100%; border-collapse:collapse; margin:20px 0; border-radius:12px; overflow:hidden; border:1px solid #e8e1d5;">
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase;">Name</td>
              <td style="padding:12px 16px; font-size:14px;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase;">Email</td>
              <td style="padding:12px 16px; font-size:14px;">${email}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase;">Project Type</td>
              <td style="padding:12px 16px; font-size:14px;">${projectType}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase;">Budget</td>
              <td style="padding:12px 16px; font-size:14px;">$${budget}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase;">Message</td>
              <td style="padding:12px 16px; font-size:14px;">${message}</td>
            </tr>
          </table>
        </div>
        <div style="padding:20px 32px; text-align:center; border-top:1px solid #e8e1d5;">
          <p style="margin:0; font-size:11px; color:#b8a99a;">HOK Interior Designs</p>
        </div>
      </div>
    </div>
  `
}

export const buildConsultationEmailTemplate = ({ name, email, phone, message, preferredDate, preferredTime }) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f7f4ef; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg, #111111 0%, #2a2a2a 100%); color:#ffffff; padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:26px; letter-spacing:0.1em; font-weight:300;">HOK</h1>
          <p style="margin:6px 0 0; color:#d97706; font-size:11px; letter-spacing:0.25em; text-transform:uppercase;">New Consultation Request</p>
        </div>
        <div style="padding:32px; color:#252525;">
          <p style="margin:0 0 16px; font-size:15px; line-height:1.6;">You have received a new consultation request:</p>
          <table style="width:100%; border-collapse:collapse; margin:20px 0; border-radius:12px; overflow:hidden; border:1px solid #e8e1d5;">
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em; width:40%;">Name</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${name}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Email</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${email}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Phone</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Preferred Date</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${preferredDate ? new Date(preferredDate).toLocaleDateString() : 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Preferred Time</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${preferredTime || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Message</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c; white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            </tr>
          </table>
        </div>
        <div style="padding:20px 32px; text-align:center; border-top:1px solid #e8e1d5;">
          <p style="margin:0; font-size:11px; color:#b8a99a; letter-spacing:0.05em;">HOK Interior Designs &mdash; Timeless spaces, elevated living.</p>
        </div>
      </div>
    </div>
  `
}

export const buildReceiptEmailTemplate = ({ orderId, items, total, customerName }) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px 12px; border-bottom:1px solid #e8e1d5;">${item.name}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #e8e1d5; text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #e8e1d5; text-align:right;">$${item.price}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f7f4ef; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:#111111; color:#ffffff; padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:26px; letter-spacing:0.1em;">Order Confirmation</h1>
        </div>
        <div style="padding:32px; color:#252525;">
          <p style="margin:0 0 16px; font-size:15px;">Thank you for your order, ${customerName}!</p>
          <p style="margin:0 0 16px; font-size:15px;">Order #${orderId}</p>
          <table style="width:100%; border-collapse:collapse; margin:20px 0; border-radius:12px; overflow:hidden; border:1px solid #e8e1d5;">
            <tr style="background:#faf8f5;">
              <th style="padding:12px; text-align:left; font-size:12px; text-transform:uppercase; color:#8a7f70;">Item</th>
              <th style="padding:12px; text-align:center; font-size:12px; text-transform:uppercase; color:#8a7f70;">Qty</th>
              <th style="padding:12px; text-align:right; font-size:12px; text-transform:uppercase; color:#8a7f70;">Price</th>
            </tr>
            ${itemsHtml}
            <tr>
              <td style="padding:12px; font-weight:600;" colspan="2">Total</td>
              <td style="padding:12px; font-weight:600; text-align:right; color:#d97706;">$${total}</td>
            </tr>
          </table>
        </div>
        <div style="padding:20px 32px; text-align:center; border-top:1px solid #e8e1d5;">
          <p style="margin:0; font-size:11px; color:#b8a99a;">HOK Interior Designs — Thank you for your purchase.</p>
        </div>
      </div>
    </div>
  `
}