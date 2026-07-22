import 'dotenv/config'
import { app } from './app.js'
import { validateEnv } from './config/env.js'
import { prisma } from './config/database.js'

validateEnv()

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
})

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  server.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  server.close()
  await prisma.$disconnect()
  process.exit(0)
})

export default server
