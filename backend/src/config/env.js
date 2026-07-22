import dotenv from 'dotenv'
dotenv.config()

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@hokinterior.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
}

export function validateEnv() {
  const missing = []
  if (!env.jwtAccessSecret) missing.push('JWT_ACCESS_SECRET')
  if (!env.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET')
  if (!env.databaseUrl) missing.push('DATABASE_URL')
  if (!env.supabaseUrl) missing.push('SUPABASE_URL')
  if (!env.supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
