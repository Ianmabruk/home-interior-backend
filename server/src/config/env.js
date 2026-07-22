const isProd = process.env.NODE_ENV === 'production'

const missing = []
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
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@hokinterior.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}
