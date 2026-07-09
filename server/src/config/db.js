import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from './env.js'

export const prisma = new PrismaClient()

export const ensureAdminUser = async () => {
  const adminEmail = env.seedAdminEmail.toLowerCase()
  const existing = await prisma.user.findFirst({
    where: { email: adminEmail },
  })

  // Only create the admin on first boot. We intentionally do NOT
  // re-hash/overwrite the password on every startup: doing so would
  // clobber a password set via the UI (or by an operator) whenever the
  // service restarts, especially when SEED_ADMIN_PASSWORD differs
  // between environments.
  if (!existing) {
    const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12)
    await prisma.user.create({
      data: {
        fullName: 'HOK Platform Admin',
        email: adminEmail,
        role: 'admin',
        isActive: true,
        passwordHash,
      },
    })
  }
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
