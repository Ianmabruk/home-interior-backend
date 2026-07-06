import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from './env.js'

export const prisma = new PrismaClient()

export const ensureAdminUser = async () => {
  const adminEmail = env.seedAdminEmail.toLowerCase()
  const existing = await prisma.user.findFirst({
    where: { email: adminEmail },
  })
  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12)

  if (!existing) {
    await prisma.user.create({
      data: {
        fullName: 'HOK Platform Admin',
        email: adminEmail,
        role: 'admin',
        isActive: true,
        passwordHash,
      },
    })
    return
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      passwordHash,
      role: 'admin',
      isActive: true,
    },
  })
}

export const connectDB = async () => {
  if (!env.databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add it to server/.env before starting the server.',
    )
  }

  await prisma.$connect()

  await ensureAdminUser()
}

export const disconnectDB = async () => {
  await prisma.$disconnect()
}
