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

  const serviceCount = await prisma.service.count()
  if (serviceCount === 0) {
    await prisma.service.createMany({
      data: [
        { title: 'Interior Design', description: 'Full-service interior design tailored to your lifestyle.', icon: 'LayoutGrid', displayOrder: 0 },
        { title: 'Virtual Consultation', description: 'Online design consultations from anywhere in the world.', icon: 'MonitorSmartphone', displayOrder: 1 },
        { title: 'Furniture Curation', description: 'Handpicked furniture and decor for timeless elegance.', icon: 'Armchair', displayOrder: 2 },
      ],
    })
    console.log('Default services created')
  }

  const testimonialCount = await prisma.testimonial.count()
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        { clientName: 'Sarah Mitchell', content: 'HOK transformed our home into a sanctuary. Absolutely stunning work!', displayOrder: 0 },
        { clientName: 'James Chen', content: 'Professional, creative, and detail-oriented. Highly recommend their virtual design service.', displayOrder: 1 },
        { clientName: 'Elena Rodriguez', content: 'The team understood our vision perfectly and brought it to life beyond expectations.', displayOrder: 2 },
      ],
    })
    console.log('Default testimonials created')
  }

  const heroCount = await prisma.heroMedia.count()
  if (heroCount === 0) {
    await prisma.heroMedia.create({
      data: {
        title: 'Luxury Interior Design',
        subtitle: 'Crafting spaces that inspire',
        isActive: true,
        displayOrder: 0,
      },
    })
    console.log('Default hero media created')
  }

  console.log('Seeding complete')
  await prisma.$disconnect()
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
