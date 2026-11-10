import crypto from 'crypto'
import { getRedisClient, isRedisAvailable } from '../config/redis.js'

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'
const TTL_MS = 60 * 60 * 1000 // 1 hour
const inMemoryStore = new Map()

async function redisSet(token) {
  const client = await getRedisClient()
  if (!client) return false
  try {
    await client.setEx(`csrf:${token}`, Math.ceil(TTL_MS / 1000), Date.now().toString())
    return true
  } catch {
    return false
  }
}

async function redisGet(token) {
  const client = await getRedisClient()
  if (!client) return null
  try {
    const data = await client.get(`csrf:${token}`)
    return data ? true : null
  } catch {
    return null
  }
}

async function redisDel(token) {
  const client = await getRedisClient()
  if (!client) return
  try {
    await client.del(`csrf:${token}`)
  } catch {
    // ignore
  }
}

export function generateCsrfToken() {
  const token = crypto.randomBytes(32).toString('hex')
  inMemoryStore.set(token, Date.now())

  // Best-effort Redis storage — fire-and-forget. In-memory store
  // always works as fallback for single-process deployments.
  redisSet(token).catch(() => {})

  return token
}

export async function validateCsrfToken(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    return next()
  }

  const headerToken = req.headers['x-csrf-token']

  if (!headerToken) {
    return res.status(403).json({ success: false, message: 'Missing CSRF token' })
  }

  const stored = await redisGet(headerToken)
  if (stored === null) {
    const mem = inMemoryStore.get(headerToken)
    if (!mem) {
      return res.status(403).json({ success: false, message: 'Invalid CSRF token' })
    }
    if (Date.now() - mem > TTL_MS) {
      inMemoryStore.delete(headerToken)
      return res.status(403).json({ success: false, message: 'Expired CSRF token' })
    }
  }

  next()
}

setInterval(() => {
  const now = Date.now()
  for (const [token, timestamp] of inMemoryStore) {
    if (now - timestamp > TTL_MS) {
      inMemoryStore.delete(token)
    }
  }
}, 60000)
