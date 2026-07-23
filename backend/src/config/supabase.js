import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

export const supabase = env.supabaseUrl && env.supabaseServiceRoleKey
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  : null

export const isSupabaseConfigured = () => Boolean(supabase)
