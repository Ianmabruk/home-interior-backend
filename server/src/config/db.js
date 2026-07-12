import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from './env.js'
import { execSync } from 'child_process'

export const prisma = new PrismaClient()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const runMigrations = async () => {
  try {
    const applied = await prisma.$queryRaw`
      SELECT "migration_name" FROM "_prisma_migrations" ORDER BY "migration_name"
    `
    const appliedNames = new Set((applied || []).map((m) => m.migration_name))

    const fs = await import('fs')
    const path = await import('path')
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations')
    const entries = await fs.promises.readdir(migrationsDir, { withFileTypes: true })
    const migrationFolders = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()

    const pending = migrationFolders.filter((name) => !appliedNames.has(name))

    if (pending.length === 0) {
      console.log('✅ Prisma migrations already applied')
      return
    }

    console.warn(`⚠️  ${pending.length} pending migration(s): ${pending.join(', ')}`)
    console.log('🚀 Running prisma migrate deploy...')
    execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: { ...process.env },
    })
    console.log('✅ Prisma migrations deployed successfully')
  } catch (err) {
    console.error('❌ Prisma migrate deploy failed:', err.message)
    console.error('   Ensure your Render build command includes: cd server && npx prisma generate && npx prisma migrate deploy')
    throw err
  }
}

const MODEL_TABLE_MAP = {
  User: 'users',
  Wishlist: 'wishlists',
  Order: 'orders',
  Product: 'products',
  Project: 'projects',
  Portfolio: 'portfolios',
  About: 'abouts',
  VirtualDesign: 'virtual_designs',
  Settings: 'settings',
  NewsletterSubscription: 'newsletter_subscriptions',
  Analytics: 'analytics',
  Message: 'messages',
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

export const connectDB = async () => {
  if (!env.databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add it to server/.env before starting the server.',
    )
  }

  await prisma.$connect()
  console.log('📝 Prisma Client connected to PostgreSQL')

  await runMigrations()
  await verifyTables()
  await ensureAdminUser()
}

export const disconnectDB = async () => {
  await prisma.$disconnect()
}
