import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from './env.js'

const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Pooler-friendly settings for Supabase / Neon / Render.
  // These are passed through to the underlying pg driver.
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const MODEL_TABLE_MAP = {
  User: 'users',
  Wishlist: 'wishlists',
  Order: 'orders',
  Product: 'products',
  Project: 'projects',
  ProjectV2: 'project_v2',
  Portfolio: 'portfolios',
  About: 'abouts',
  VirtualDesign: 'virtual_designs',
  Settings: 'settings',
  NewsletterSubscription: 'newsletter_subscriptions',
  Analytics: 'analytics',
  Message: 'messages',
  Testimonial: 'testimonials',
}

export const verifyTables = async () => {
  const models = Object.keys(MODEL_TABLE_MAP)
  const missing = []
  for (const model of models) {
    try {
      const tableName = MODEL_TABLE_MAP[model]
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 0`)
    } catch {
      missing.push(model)
    }
  }
  if (missing.length) {
    console.error(`❌ Missing tables: ${missing.join(', ')}`)
    throw new Error(`Missing database tables: ${missing.join(', ')}`)
  }
  console.log(`✅ All ${models.length} Prisma tables verified`)
}

const MEDIA_SETTINGS_TABLES = [
  { table: 'projects', column: 'media_settings' },
  { table: 'portfolios', column: 'media_settings' },
  { table: 'abouts', column: 'media_settings' },
  { table: 'products', column: 'media_settings' },
  { table: 'virtual_designs', column: 'media_settings' },
]

export const verifyMediaSettingsColumns = async () => {
  const missing = []
  for (const { table, column } of MEDIA_SETTINGS_TABLES) {
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}'`)
    } catch {
      missing.push(`${table}.${column}`)
    }
  }
  if (missing.length > 0) {
    console.error(`❌ Missing media_settings columns: ${missing.join(', ')}`)
    throw new Error(`Missing database columns: ${missing.join(', ')}`)
  }
  console.log('✅ media_settings columns verified on all content tables')
}

export const verifyAndHealSchema = async () => {
  let models
  try {
    models = Prisma.dmmf.datamodel.models
  } catch {
    console.warn('[SCHEMA GUARD] Prisma DMMF unavailable — skipping drift check.')
    return
  }

  let warnings = 0

  for (const model of models) {
    const table = model.dbName || toSnake(model.name)
    let actualColumns = []
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}'`,
      )
      actualColumns = rows.map((r) => r.column_name)
    } catch {
      continue
    }
    const actualSet = new Set(actualColumns)

    for (const field of model.fields) {
      if (field.kind !== 'scalar') continue
      const column = field.dbName || field.name
      if (!actualSet.has(column)) {
        console.warn(`[SCHEMA GUARD] ⚠️  Drift: ${table}.${column} exists in schema.prisma but is MISSING from the database.`)
        warnings += 1
      }
    }
  }

  if (warnings === 0) {
    console.log('✅ Schema guard: Prisma models match database columns (no drift).')
  } else {
    console.log(`[SCHEMA GUARD] Summary — ${warnings} drift warning(s). Align application code with the schema; no database changes were made.`)
  }
}

const toSnake = (str) =>
  str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase()

export const ensureAdminUser = async () => {
  const adminEmail = env.seedAdminEmail.toLowerCase()
  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const existing = await prisma.user.findFirst({
        where: { email: adminEmail },
      })

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
        console.log('✅ Admin user created')
      } else if (existing.role !== 'admin' || !existing.isActive) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: 'admin', isActive: true },
        })
        console.log('✅ Admin user promoted to active admin')
      } else {
        console.log('✅ Admin user already exists')
      }
      return
    } catch (err) {
      if (attempt < maxRetries) {
        console.log(`⚠️  ensureAdminUser attempt ${attempt} failed: ${err.message} — retrying...`)
        await sleep(1000 * attempt)
      } else {
        console.error(`❌ ensureAdminUser failed after ${maxRetries} attempts:`, err.message)
        throw err
      }
    }
  }
}

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

      if (isConnErr) {
        console.warn(`[${label}] Connection error on attempt ${attempt}/${maxRetries}: ${err?.code || err?.name}: ${err?.message}`)
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
          console.log(`[${label}] Waiting ${delay}ms before retry...`)
          await sleep(delay)
          try {
            await prisma.$connect()
            console.log(`[${label}] Reconnected to database`)
          } catch (reconnectErr) {
            console.error(`[${label}] Reconnection failed:`, reconnectErr?.message)
          }
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

export const checkDatabaseHealth = async () => {
  try {
    await executeWithRetry(() => prisma.$queryRaw`SELECT 1`, 'HEALTH', { maxRetries: 2, timeout: 5000 })
    return { database: 'connected', prisma: 'connected' }
  } catch (err) {
    console.error('[HEALTH CHECK] Database health check failed:', err?.message)
    return { database: 'disconnected', prisma: 'disconnected', error: err?.message }
  }
}

export const connectDB = async () => {
  if (!env.databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add it to server/.env before starting the server.',
    )
  }

  console.log('🔌 Connecting to PostgreSQL...')

  let connected = false
  const maxStartupRetries = 5
  for (let attempt = 1; attempt <= maxStartupRetries; attempt++) {
    try {
      await prisma.$connect()
      connected = true
      console.log('📝 Prisma Client connected to PostgreSQL')
      break
    } catch (err) {
      if (isP1001(err) && attempt < maxStartupRetries) {
        console.warn(`🔌 Connection attempt ${attempt}/${maxStartupRetries} failed (P1001), retrying in ${attempt * 2}s...`)
        await sleep(attempt * 2000)
      } else {
        throw err
      }
    }
  }

  if (!connected) {
    throw new Error('Failed to connect to database after multiple attempts')
  }

  // In production, skip expensive startup verification by default.
  // Set SKIP_DB_VERIFY=false to force full verification.
  const skipVerify = process.env.SKIP_DB_VERIFY !== 'false'
  if (skipVerify && env.nodeEnv === 'production') {
    console.log('✅ Skipping startup DB verification (SKIP_DB_VERIFY=true)')
    return
  }

  // Development / explicit verification
  await verifyTables()
  await verifyMediaSettingsColumns()
  await verifyAndHealSchema()
  await ensureAdminUser()
}

export const disconnectDB = async () => {
  await prisma.$disconnect()
}

export { prisma }