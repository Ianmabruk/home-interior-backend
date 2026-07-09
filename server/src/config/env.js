import dotenv from 'dotenv'

dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

const missing = []
if (isProd && !process.env.DATABASE_URL) missing.push('DATABASE_URL')
if (isProd && !process.env.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET')
if (isProd && !process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET')
if (isProd && !process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME')
if (isProd && !process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY')
if (isProd && !process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET')

if (missing.length) {
  console.error('❌ Missing required environment variables:', missing.join(', '))
  console.error('   Add them in your Render dashboard → Environment tab.')
  if (isProd) {
    console.error('   Server cannot start without these variables.')
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  sendGridApiKey: process.env.SENDGRID_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'no-reply@hokinterior.com',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@hokinterior.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
}
