import mongoose from 'mongoose'
import { env } from './env.js'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'

const ensureAdminUser = async () => {
  const adminEmail = env.seedAdminEmail.toLowerCase()
  const existing = await User.findOne({ email: adminEmail })
  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12)
  if (!existing) {
    await User.create({
      fullName: 'HOK Platform Admin',
      email: adminEmail,
      role: 'admin',
      isActive: true,
      passwordHash,
    })
    return
  }
  await User.findByIdAndUpdate(existing._id, {
    passwordHash,
    role: 'admin',
    isActive: true,
  })
}

export const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error(
      'MONGO_URI is not set. Add it to server/.env before starting the server.',
    )
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 30000,
    family: 4,
  })

  const dbName = mongoose.connection.db.databaseName
  // eslint-disable-next-line no-console
  console.log(`MongoDB Atlas connected — database: ${dbName}`)

  await ensureAdminUser()
}

export const disconnectDB = async () => {
  await mongoose.connection.close()
}
