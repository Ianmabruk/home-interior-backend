import { mediaService } from './mediaService'

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

function isRetryableUploadError(error) {
  const status = error?.response?.status || error?.status
  if (status) return RETRYABLE_STATUS.has(status)
  return error?.retryable === true || error?.name === 'TypeError' || /network|fetch|timed out/i.test(error?.message || '')
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function uploadBlogMediaFile(file, uploadId, options = {}) {
  const { onRetry, ...handlers } = options
  let lastError
  for (let attempt = 0; attempt <= 2; attempt += 1) {
    try {
      const asset = Object.keys(handlers).length > 0
        ? await mediaService.upload(file, 'blogs', uploadId, handlers)
        : await mediaService.upload(file, 'blogs', uploadId)
      if (!asset?.secureUrl || !asset?.publicId || !['image', 'video'].includes(asset.resourceType)) {
        throw new Error('The server returned incomplete media details. Retry this file.')
      }
      return asset
    } catch (error) {
      lastError = error
      if (attempt === 2 || !isRetryableUploadError(error)) break
      onRetry?.(attempt + 1)
      await wait(1000 * (2 ** attempt))
    }
  }
  throw lastError
}

export function createBlogUploadId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replaceAll('-', '')
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}