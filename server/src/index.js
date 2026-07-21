import { app } from './app.js'
import { prisma, connectDB } from './config/prisma.js'
import { verifyCloudinaryConfig } from './config/cloudinary.js'
import { env } from './config/env.js'

const logDatabaseConfig = () => {
  const dbUrl = env.databaseUrl || ''
  console.log(`  DATABASE_URL : ${dbUrl ? 'configured' : '❌ NOT SET'}`)
  console.log(`  DIRECT_URL   : ${env.directUrl ? 'configured' : '❌ NOT SET'}`)

  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl)
      console.log(`  DB Host      : ${parsed.hostname}`)
      console.log(`  DB Port      : ${parsed.port}`)
      console.log(`  DB Protocol  : ${parsed.protocol.replace(':', '')}`)
    } catch (e) {
      console.log('  DB Parse     : ❌ Failed to parse DATABASE_URL')
    }
  }
}

const start = async () => {
  console.log(`DEPLOY VERSION: ${"50fa4cf24fcb93e7e6d4552c1de55735b9bc4e6e"}`)
  console.log('')
  console.log('══════════════════════════════════════════')
  console.log('  HOK Interior Designs — Backend Startup')
  console.log('══════════════════════════════════════════')
  console.log(`  Environment : ${env.nodeEnv}`)
  console.log(`  Port        : ${env.port}`)
  logDatabaseConfig()
  console.log(`  CLIENT_URL  : ${env.clientUrl}`)
  console.log(`  Cloudinary  : ${env.cloudinaryCloudName || '❌ NOT SET'}`)
  console.log(`  Admin email : ${env.seedAdminEmail}`)
  console.log('══════════════════════════════════════════')
  console.log('')

  try {
    await connectDB()
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
