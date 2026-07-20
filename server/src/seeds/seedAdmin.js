import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'

dotenv.config()

const seedAdmin = async () => {
  try {
    const adminEmail = env.seedAdminEmail.toLowerCase()
    const adminPassword = env.seedAdminPassword
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

    const admin = await prisma.user.upsert({
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

    console.log('Admin user ensured successfully')
    console.log(`Admin email: ${admin.email}`)
    console.log(`Admin password: ${adminPassword}`)

    await prisma.$disconnect()
  } catch (error) {
    console.error('Admin seed failed', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

seedAdmin()
