import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'

dotenv.config()

const seedAdmin = async () => {
  try {
    const adminEmail = env.seedAdminEmail.toLowerCase()
    const adminPassword = env.seedAdminPassword
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    if (data) {
      await supabase
        .from('users')
        .update({
          full_name: 'HOK Platform Admin',
          email: adminEmail,
          role: 'admin',
          is_active: true,
          password_hash: adminPasswordHash,
        })
        .eq('id', data.id)

      console.log('Admin user updated successfully')
    } else {
      await supabase
        .from('users')
        .insert([{
          full_name: 'HOK Platform Admin',
          email: adminEmail,
          role: 'admin',
          is_active: true,
          password_hash: adminPasswordHash,
        }])

      console.log('Admin user created successfully')
    }

    console.log('Admin seed completed successfully')
  } catch (error) {
    console.error('Admin seed failed', error)
    process.exit(1)
  }
}

seedAdmin()
