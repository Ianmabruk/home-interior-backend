import { jest } from '@jest/globals'
import * as brevo from '@getbrevo/brevo'
import { sendRawEmail } from '../src/services/emailService.js'

describe('Email provider selection', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.SMTP_PASSWORD
    process.env.BREVO_API_KEY = 'test-brevo-key'
    process.env.BREVO_SENDER_EMAIL = 'hello@hokinteriors.co.ke'
    process.env.BREVO_SENDER_NAME = 'HOK Interiors'
    jest.restoreAllMocks()
    jest.spyOn(brevo.TransactionalEmailsApi.prototype, 'sendTransacEmail').mockResolvedValue({
      body: { messageId: 'brevo-msg-123' },
    })
  })

  afterAll(() => {
    process.env = { ...originalEnv }
  })

  it('uses Brevo when it is configured and SMTP is unavailable', async () => {
    const result = await sendRawEmail({
      eventId: 'provider_select_test',
      to: 'customer@example.com',
      name: 'Jane Doe',
      subject: 'Test email',
      html: '<p>hello</p>',
      text: 'hello',
    })

    expect(result.provider).toBe('brevo')
    expect(result.status).toBe('sent')
    expect(result.messageId).toBe('brevo-msg-123')
  })
})
