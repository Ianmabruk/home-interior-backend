import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'

const missingVars = []
if (!env.cloudinaryCloudName) missingVars.push('CLOUDINARY_CLOUD_NAME')
if (!env.cloudinaryApiKey) missingVars.push('CLOUDINARY_API_KEY')
if (!env.cloudinaryApiSecret) missingVars.push('CLOUDINARY_API_SECRET')

if (missingVars.length > 0) {
  throw new Error(
    `Cloudinary is not configured. Missing environment variables: ${missingVars.join(', ')}`,
  )
}

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
})

// Validate credentials at boot WITHOUT leaking the secret. Logs a clear
// warning on misconfiguration so a bad CLOUDINARY_API_SECRET (e.g. after a
// secret rotation) is caught on deploy instead of failing every upload.
export const verifyCloudinaryConfig = async () => {
  const configured = Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret,
  )
  if (!configured) {
    console.warn('[CLOUDINARY] Missing config (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET). Uploads will fail.')
    return false
  }
  try {
    const res = await cloudinary.api.ping()
    if (res?.status === 'ok') {
      console.log(`[CLOUDINARY] Credentials verified (cloud: ${env.cloudinaryCloudName}).`)
      return true
    }
    console.warn('[CLOUDINARY] Ping returned unexpected status:', res?.status)
    return false
  } catch (err) {
    console.warn(
      '[CLOUDINARY] Credential check failed — uploads will 401. Verify CLOUDINARY_API_KEY/API_SECRET match the Cloudinary dashboard.',
      err?.message || err,
    )
    return false
  }
}

export default cloudinary
