export { prisma, executeWithRetry, connectDB } from './prisma.js'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from './env.js'

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

export const checkDatabaseHealth = async () => {
  try {
    await executeWithRetry(() => prisma.$queryRaw`SELECT 1`, 'HEALTH', { maxRetries: 2, timeout: 5000 })
    return { database: 'connected', prisma: 'connected' }
  } catch (err) {
    console.error('[HEALTH CHECK] Database health check failed:', err?.message)
    return { database: 'disconnected', prisma: 'disconnected', error: err?.message }
  }
}
