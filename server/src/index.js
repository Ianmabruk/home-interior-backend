import { app } from './app.js'
import { prisma } from './config/prisma.js'
import { verifyCloudinaryConfig } from './config/cloudinary.js'
import { env } from './config/env.js'

const start = async () => {
  console.log('')
  console.log('══════════════════════════════════════════')
  console.log('  HOK Interior Designs — Backend Startup')
  console.log('══════════════════════════════════════════')
  console.log(`  Environment : ${env.nodeEnv}`)
  console.log(`  Port        : ${env.port}`)
  console.log(`  DATABASE_URL : ${env.databaseUrl ? 'configured' : '❌ NOT SET'}`)
  console.log(`  CLIENT_URL  : ${env.clientUrl}`)
  console.log(`  Cloudinary  : ${env.cloudinaryCloudName || '❌ NOT SET'}`)
  console.log(`  Admin email : ${env.seedAdminEmail}`)
  console.log('══════════════════════════════════════════')
  console.log('')

  try {
    await prisma.$connect()
    console.log('📝 Prisma Client connected to PostgreSQL')
    verifyCloudinaryConfig().catch(() => {})
    app.listen(env.port, "0.0.0.0", () => {
      console.log(`Server listening on port ${env.port}`)
    })
  } catch (error) {
    console.error('Failed to start server', error)
    process.exit(1)
  }
}

start()
