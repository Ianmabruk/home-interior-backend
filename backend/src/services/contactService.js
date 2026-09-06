import { prisma } from '../config/database.js'

const CONTACT_KEYS = ['contact.phoneNumbers', 'contact.emails', 'contact.addresses', 'contact.businessHours']

function parseJson(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export const contactService = {
  getContact,
}

async function getContact() {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: CONTACT_KEYS } },
  })

  const result = {}
  for (const s of settings) {
    result[s.key] = parseJson(s.value) || s.value
  }

  return {
    phoneNumbers: result['contact.phoneNumbers'] || [],
    emails: result['contact.emails'] || [],
    addresses: result['contact.addresses'] || [],
    businessHours: result['contact.businessHours'] || '',
  }
}