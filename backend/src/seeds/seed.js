import bcrypt from 'bcryptjs'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'

async function seed() {
  await prisma.$connect()

  const existingAdmin = await prisma.admin.findFirst()
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12)
    await prisma.admin.create({
      data: {
        email: env.seedAdminEmail,
        passwordHash,
        fullName: 'Admin',
        role: 'ADMIN',
      },
    })
    console.log('Default admin created')
  }

  const aboutCount = await prisma.about.count()
  if (aboutCount === 0) {
    await prisma.about.create({
      data: {
        story: 'We are HOK Interiors, dedicated to creating beautiful spaces.',
        companyDesc: 'HOK Interiors provides premium interior design services.',
        mission: 'To transform spaces into inspiring environments.',
        vision: 'To be the leading interior design studio.',
        location: '',
        contactEmail: 'info@hokinteriors.com',
        socials: '{}',
      },
    })
    console.log('Default about created')
  }

  const settingsToSeed = [
    { key: 'siteName', value: 'HOK Interiors' },
    { key: 'supportEmail', value: 'info@hokinteriors.com' },
    { key: 'currency', value: 'USD' },
    { key: 'maintenanceMode', value: 'false' },
    { key: 'shippingPolicy', value: '' },
    { key: 'returnPolicy', value: '' },
    { key: 'socialLinks', value: '' },
  ]

  for (const s of settingsToSeed) {
    const existing = await prisma.siteSetting.findUnique({ where: { key: s.key } })
    if (!existing) {
      await prisma.siteSetting.create({ data: s })
    }
  }
  console.log('Default settings created')

  console.log('Seeding complete')
  await prisma.$disconnect()
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
