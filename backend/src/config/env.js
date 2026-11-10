import dotenv from 'dotenv'

dotenv.config({ override: false })

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || '',
  serverId: process.env.SERVER_ID || 'hok-api-01',
  redisUrl: process.env.REDIS_URL || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  adminEmail: process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD,
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
  brevoApiKey: process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '',
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || process.env.SENDINBLUE_SENDER_EMAIL || '',
  brevoSenderName: process.env.BREVO_SENDER_NAME || 'HOK Interiors',
  email: {
    smtpHost: process.env.SMTP_HOST || 'mail.hokinteriors.co.ke',
    smtpPort: Number(process.env.SMTP_PORT) || 465,
    smtpSecure: process.env.SMTP_SECURE !== 'false',
    smtpUser: process.env.SMTP_USER || process.env.SMTP_FROM || 'info@hokinteriors.co.ke',
    smtpFrom: process.env.SMTP_FROM || 'HOK Interiors <info@hokinteriors.co.ke>',
    loginNotificationEnabled: process.env.LOGIN_NOTIFICATION_ENABLED !== 'false',
  },
}

export function validateEnv() {
  const missing = []
  if (!env.jwtAccessSecret) missing.push('JWT_ACCESS_SECRET')
  if (!env.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET')
  if (!env.databaseUrl) missing.push('DATABASE_URL')
  if (env.brevoApiKey && !env.brevoSenderEmail) missing.push('BREVO_SENDER_EMAIL')
  const hasCloudinary = process.env.SKIP_CLOUDINARY !== 'true' && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  const isDevWithNoStorage = process.env.NODE_ENV === 'development' && process.env.SKIP_CLOUDINARY === 'true'
  if (!hasCloudinary && !hasSupabase && !isDevWithNoStorage) {
    missing.push('Either CLOUDINARY_* or SUPABASE_* environment variables for file storage (set SKIP_CLOUDINARY=true for local dev storage)')
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (env.jwtAccessSecret && env.jwtAccessSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters')
  }
  if (env.jwtRefreshSecret && env.jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters')
  }

  if (env.seedAdminPassword && env.seedAdminPassword.length < 12 && env.nodeEnv !== 'production') {
    throw new Error('SEED_ADMIN_PASSWORD / ADMIN_PASSWORD must be at least 12 characters')
  }

  if (env.seedAdminPassword === 'admin123' && env.nodeEnv === 'production') {
    console.warn(`[${env.serverId}] [WARNING] Using the default insecure admin password. Set a strong ADMIN_PASSWORD in production.`)
  }

  if (env.databaseUrl && process.env.NODE_ENV === 'production') {
    const dbHost = new URL(env.databaseUrl).hostname
    if (dbHost.includes('neon.tech')) {
      console.log(`[${env.serverId}] [INFO] Using Neon Postgres (${dbHost}). Connection configured for production workloads (pgbouncer + connection_limit=10).`)
    }
  }
}
