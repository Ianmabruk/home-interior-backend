import dotenv from 'dotenv'
dotenv.config()

import { app } from './app.js'
import { verifyCloudinaryConfig } from './config/cloudinary.js'
import { env } from './config/env.js'

const start = async () => {
  console.log('════════════════════════════')
  console.log('HOK Interior Designs Backend')
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Port:', process.env.PORT || 5000)
  console.log('Supabase:', process.env.SUPABASE_URL ? 'configured' : 'missing')
  console.log('Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME)
  console.log('════════════════════════════')

  try {
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
