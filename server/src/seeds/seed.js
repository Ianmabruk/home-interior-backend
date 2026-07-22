import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import {
  aboutSeed,
  portfolioSeed,
  productsSeed,
  servicesSeed,
  testimonialsSeed,
} from './seedData.js'

dotenv.config()

const seed = async () => {
  try {
    const { data: portfolioCountRes } = await supabase
      .from('portfolios')
      .select('id', { count: 'exact', head: true })

    const portfolioCount = portfolioCountRes?.length || 0
    if (portfolioCount === 0) {
      for (const item of portfolioSeed) {
        await supabase.from('portfolios').insert([item])
      }
    }

    const { data: productCountRes } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })

    const productCount = productCountRes?.length || 0
    if (productCount === 0) {
      for (const item of productsSeed) {
        await supabase.from('products').insert([item])
      }
    }

    const { data: serviceCountRes } = await supabase
      .from('services')
      .select('id', { count: 'exact', head: true })

    const serviceCount = serviceCountRes?.length || 0
    if (serviceCount === 0) {
      for (const item of servicesSeed) {
        await supabase.from('services').insert([item])
      }
    }

    const { data: testimonialCountRes } = await supabase
      .from('testimonials')
      .select('id', { count: 'exact', head: true })

    const testimonialCount = testimonialCountRes?.length || 0
    if (testimonialCount === 0) {
      for (const item of testimonialsSeed) {
        await supabase.from('testimonials').insert([item])
      }
    }

    const { data: aboutCountRes } = await supabase
      .from('abouts')
      .select('id', { count: 'exact', head: true })

    const aboutCount = aboutCountRes?.length || 0
    if (aboutCount === 0) {
      await supabase.from('abouts').insert([aboutSeed])
    }

    const { data: settingsCountRes } = await supabase
      .from('settings')
      .select('id', { count: 'exact', head: true })

    const settingsCount = settingsCountRes?.length || 0
    if (settingsCount === 0) {
      await supabase.from('settings').insert([{
        site_name: 'HOK Interior Designs',
        support_email: 'info@hokinterior.com',
        maintenance_mode: false,
        currency: 'USD',
        shipping_policy: '',
        return_policy: '',
      }])
    }

    const adminEmail = env.seedAdminEmail.toLowerCase()
    const adminPassword = env.seedAdminPassword
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single()

    if (existingAdmin) {
      await supabase
        .from('users')
        .update({
          full_name: 'HOK Platform Admin',
          email: adminEmail,
          role: 'admin',
          is_active: true,
          password_hash: adminPasswordHash,
        })
        .eq('id', existingAdmin.id)
    } else {
      await supabase.from('users').insert([{
        full_name: 'HOK Platform Admin',
        email: adminEmail,
        role: 'admin',
        is_active: true,
        password_hash: adminPasswordHash,
      }])
    }

    console.log('Seed completed successfully')
    console.log(`Admin email: ${adminEmail}`)
    console.log(`Admin password: ${adminPassword}`)

    process.exit(0)
  } catch (error) {
    console.error('Seed failed', error)
    process.exit(1)
  }
}

seed()
