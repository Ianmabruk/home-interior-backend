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
    const analyticsCount = await prisma.analytics.count()
    if (analyticsCount === 0) {
      for (const row of analyticsSeed) {
        await prisma.analytics.create({ data: row })
      }
    }

    const portfolioCount = await prisma.portfolio.count()
    if (portfolioCount === 0) {
      for (const item of portfolioSeed) {
        await prisma.portfolio.create({ data: item })
      }
    }

    const productCount = await prisma.product.count()
    if (productCount === 0) {
      for (const item of productsSeed) {
        await prisma.product.create({ data: item })
      }
    }

    const virtualDesignCount = await prisma.virtualDesign.count()
    if (virtualDesignCount === 0) {
      for (const item of virtualDesignSeed) {
        await prisma.virtualDesign.create({ data: item })
      }
    }

    const serviceCount = await prisma.service.count()
    if (serviceCount === 0) {
      for (const item of servicesSeed) {
        await prisma.service.create({ data: item })
      }
    }

    const testimonialCount = await prisma.testimonial.count()
    if (testimonialCount === 0) {
      for (const item of testimonialsSeed) {
        await prisma.testimonial.create({ data: item })
      }
    }

    const aboutCount = await prisma.about.count()
    if (aboutCount === 0) {
      await prisma.about.create({ data: aboutSeed })
    }

    const settingsCount = await prisma.settings.count()
    if (settingsCount === 0) {
      await prisma.settings.create({ data: settingsSeed })
    }

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
