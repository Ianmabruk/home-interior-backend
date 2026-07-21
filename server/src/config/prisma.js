import { PrismaClient, Prisma } from '@prisma/client'
import { env } from './env.js'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: env.databaseUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const isP1001 = (err) => err?.code === 'P1001' || (err?.message?.includes('P1001') && err?.message?.includes("Can't reach database server"))

const isConnectionError = (err) =>
  isP1001(err) ||
  err?.code === 'P1002' ||
  err?.code === 'P1003' ||
  err?.code === 'P1008' ||
  err?.code === 'P1017' ||
  (err?.message?.includes('connection') && err?.message?.includes('terminated')) ||
  (err?.message?.includes('socket') && err?.message?.includes('closed')) ||
  (err?.name === 'PrismaClientKnownRequestError' && err?.code?.startsWith('P10'))

const isPreparedStatementError = (err) => {
  const msg = (err?.message || '').toLowerCase()
  return (
    msg.includes('prepared statement') ||
    err?.code === '26000' ||
    err?.code === '42P05'
  )
}

export const executeWithRetry = async (operation, label = 'DB', options = {}) => {
  const { maxRetries = 3, baseDelay = 500, maxDelay = 5000, timeout = 15000 } = options
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} query timeout after ${timeout}ms`)), timeout),
      )
      return await Promise.race([operation(), timeoutPromise])
    } catch (err) {
      lastError = err
      const isConnErr = isConnectionError(err)
      const isStmtErr = isPreparedStatementError(err)

      if (isConnErr || isStmtErr) {
        const labelText = isStmtErr ? 'Prepared-statement' : 'Connection'
        console.warn(`[${labelText}] ${label} attempt ${attempt}/${maxRetries}: ${err?.code || err?.name}: ${err?.message}`)
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
          await sleep(delay)
          continue
        }
      } else {
        console.error(`[${label}] Non-retryable error:`, err?.message)
        throw err
      }
    }
  }
  throw lastError
}

export const connectDB = async () => {
  console.log('🔌 Connecting to PostgreSQL...')

  const maxStartupRetries = 5
  for (let attempt = 1; attempt <= maxStartupRetries; attempt++) {
    try {
      await prisma.$connect()
      console.log('📝 Prisma Client connected to PostgreSQL')
      
      // Verify critical columns exist to catch schema drift early
      try {
        await prisma.$queryRaw`SELECT 1 FROM "users" LIMIT 0`
        console.log('✅ users table accessible')
      } catch (err) {
        console.error('❌ CRITICAL: users table check failed:', err.message)
        if (env.nodeEnv !== 'production') throw err
      }
      
      return
    } catch (err) {
      if (isP1001(err) && attempt < maxStartupRetries) {
        console.warn(`🔌 Connection attempt ${attempt}/${maxStartupRetries} failed (P1001), retrying in ${attempt * 2}s...`)
        await sleep(attempt * 2000)
      } else {
        throw err
      }
    }
  }
}

export const checkDatabaseHealth = async () => {
  try {
    await executeWithRetry(() => prisma.$queryRaw`SELECT 1`, 'HEALTH', { maxRetries: 2, timeout: 5000 })
    return { database: 'connected', prisma: 'connected' }
  } catch (err) {
    console.error('[HEALTH CHECK] Database health check failed:', err?.message)
    return { database: 'disconnected', prisma: 'disconnected', error: err?.message }
  }
}

export default prisma
