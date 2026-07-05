import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import { Analytics } from '../models/Analytics.js'
import { About } from '../models/About.js'
import { Portfolio } from '../models/Portfolio.js'
import { Product } from '../models/Product.js'
import { Project } from '../models/Project.js'
import { Settings } from '../models/Settings.js'
import { User } from '../models/User.js'
import { VirtualDesign } from '../models/VirtualDesign.js'
import {
  aboutSeed,
  analyticsSeed,
  portfolioSeed,
  productsSeed,
  projectsSeed,
  settingsSeed,
  virtualDesignSeed,
} from './seedData.js'

dotenv.config()

const seed = async () => {
  try {
    await connectDB()

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@hokinterior.com'
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123!'

    const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

    await User.updateOne(
      { email: adminEmail },
      {
        $set: {
          fullName: 'HOK Platform Admin',
          email: adminEmail,
          role: 'admin',
          isActive: true,
          passwordHash: adminPasswordHash,
        },
      },
      { upsert: true },
    )

    for (const item of productsSeed) {
      await Product.updateOne({ sku: item.sku }, { $set: item }, { upsert: true })
    }

    for (const item of projectsSeed) {
      await Project.updateOne({ title: item.title }, { $set: item }, { upsert: true })
    }

    for (const item of portfolioSeed) {
      await Portfolio.updateOne({ title: item.title }, { $set: item }, { upsert: true })
    }

    for (const item of virtualDesignSeed) {
      await VirtualDesign.updateOne({ title: item.title }, { $set: item }, { upsert: true })
    }

    for (const row of analyticsSeed) {
      await Analytics.updateOne({ date: row.date }, { $set: row }, { upsert: true })
    }

    await About.updateOne({}, { $set: aboutSeed }, { upsert: true })
    await Settings.updateOne({}, { $set: settingsSeed }, { upsert: true })

    // eslint-disable-next-line no-console
    console.log('Seed completed successfully')
    // eslint-disable-next-line no-console
    console.log(`Admin email: ${adminEmail}`)
    // eslint-disable-next-line no-console
    console.log(`Admin password: ${adminPassword}`)

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

seed()
