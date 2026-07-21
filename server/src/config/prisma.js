import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  })

globalForPrisma.prisma = globalForPrisma.prisma || prisma

export const connectDB = async () => {
  console.log('Connecting to PostgreSQL...')
  await prisma.$connect()
  console.log('Prisma Client connected to PostgreSQL')
}

export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { database: 'connected', prisma: 'connected' }
  } catch (err) {
    console.error('[HEALTH CHECK] Database health check failed:', err?.message)
    return { database: 'disconnected', prisma: 'disconnected', error: err?.message }
  }
}

export default prisma
