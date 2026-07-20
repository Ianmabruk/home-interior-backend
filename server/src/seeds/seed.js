import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { ensureAdminUser } from '../config/prisma.js'
import {
  aboutSeed,
  analyticsSeed,
  portfolioSeed,
  productsSeed,
  projectsSeed,
  servicesSeed,
  settingsSeed,
  testimonialsSeed,
  virtualDesignSeed,
} from './seedData.js'

dotenv.config()

const seed = async () => {
  try {
    await prisma.analytics.deleteMany()
    await prisma.portfolio.deleteMany()
    await prisma.project.deleteMany()
    await prisma.product.deleteMany()
    await prisma.virtualDesign.deleteMany()
    await prisma.service.deleteMany()
    await prisma.testimonial.deleteMany()
    await prisma.about.deleteMany()
    await prisma.settings.deleteMany()
    await prisma.newsletterSubscription.deleteMany()

    for (const item of productsSeed) {
      await prisma.product.create({ data: item })
    }

    for (const item of projectsSeed) {
      await prisma.project.create({ data: item })
    }

    for (const item of portfolioSeed) {
      await prisma.portfolio.create({ data: item })
    }

    for (const item of servicesSeed) {
      await prisma.service.create({ data: item })
    }

    for (const item of virtualDesignSeed) {
      await prisma.virtualDesign.create({ data: item })
    }

    for (const row of analyticsSeed) {
      await prisma.analytics.create({ data: row })
    }

    for (const item of testimonialsSeed) {
      await prisma.testimonial.create({ data: item })
    }

    await prisma.about.create({ data: aboutSeed })
    await prisma.settings.create({ data: settingsSeed })

    const adminEmail = env.seedAdminEmail.toLowerCase()
    const adminPassword = env.seedAdminPassword
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        fullName: 'HOK Platform Admin',
        email: adminEmail,
        role: 'admin',
        isActive: true,
        passwordHash: adminPasswordHash,
      },
      create: {
        fullName: 'HOK Platform Admin',
        email: adminEmail,
        role: 'admin',
        isActive: true,
        passwordHash: adminPasswordHash,
      },
    })

    console.log('Seed completed successfully')
    console.log(`Admin email: ${adminEmail}`)
    console.log(`Admin password: ${adminPassword}`)

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Seed failed', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

seed()
