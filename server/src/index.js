import { app } from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'

const start = async () => {
  console.log('')
  console.log('══════════════════════════════════════════')
  console.log('  HOK Interior Designs — Backend Startup')
  console.log('══════════════════════════════════════════')
  console.log(`  Environment : ${env.nodeEnv}`)
  console.log(`  Port        : ${env.port}`)
  console.log(`  DATABASE_URL : ${env.databaseUrl ? env.databaseUrl.slice(0, 40) + '...' : '❌ NOT SET'}`)
  console.log(`  CLIENT_URL  : ${env.clientUrl}`)
  console.log(`  Cloudinary  : ${env.cloudinaryCloudName || '❌ NOT SET'}`)
  console.log(`  SendGrid    : ${env.sendGridApiKey ? 'configured' : '❌ NOT SET'}`)
  console.log(`  Admin email : ${env.seedAdminEmail}`)
  console.log('══════════════════════════════════════════')
  console.log('')

  try {
    await connectDB()
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on port ${env.port}`)
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error)
    process.exit(1)
  }
}

start()
