import { mediaService } from './mediaService'
import { ensureValidToken, attemptTokenRefresh } from './api'

export const UPLOAD_CONCURRENCY = 3
export const MAX_RETRIES = 3
export const RETRY_BASE_DELAY = 1000

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])
const AUTH_STATUSES = new Set([401, 403])

function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message
  if (err?.message) return err.message
  return 'Upload failed'
}

function isRetryableError(err) {
  if (err?.message && err.message.startsWith('Authentication required')) return false
  const status = err?.response?.status
  if (!status) return true
  if (AUTH_STATUSES.has(status)) return false
  return RETRYABLE_STATUSES.has(status)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function jitter(base) {
  return base + Math.random() * base * 0.3
}

export async function warmServer() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
    await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
  } catch {
    // Non-fatal — the upload will still work, just possibly slower.
  }
}

export async function refreshCsrf() {
  try {
    return await attemptTokenRefresh()
  } catch (refreshErr) {
    throw new Error('Failed to refresh CSRF token', { cause: refreshErr })
  }
}

export function validateImageFile(file) {
  const errors = []
  if (!file) {
    errors.push('File is required')
    return errors
  }
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  if (!validTypes.includes(file.type)) {
    errors.push(`Unsupported format: ${file.type || 'unknown'}`)
  }
  const MAX_SIZE = 100 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    errors.push(`File "${file.name}" exceeds maximum size of 100 MB`)
  }
  if (file.size === 0) {
    errors.push(`File "${file.name}" is empty`)
  }
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
  if (!validExts.includes(ext)) {
    errors.push(`Invalid file extension: ${ext}`)
  }
  return errors
}

export async function uploadSingleImage(file, folder = 'portfolio/before', options = {}) {
  const { signal, onProgress, onStateChange, maxRetries = MAX_RETRIES } = options || {}

  onStateChange?.('compressing')

  let attempt = 0
  let lastError = null

  while (attempt <= maxRetries) {
    if (attempt > 0) {
      const delay = jitter(RETRY_BASE_DELAY * Math.pow(2, attempt - 1))
      onStateChange?.('retrying')
      await sleep(delay)
    }

    onStateChange?.('uploading')

    try {
      try {
        await ensureValidToken()
      } catch (tokenErr) {
        const isNetworkError =
          tokenErr?.message?.includes('Could not refresh') ||
          tokenErr?.message?.includes('Network error') ||
          tokenErr?.cause?.name === 'AbortError' ||
          tokenErr?.cause?.name === 'TypeError'

        if (isNetworkError && attempt < maxRetries) {
          attempt++
          continue
        }

        onStateChange?.('failed')
        throw new Error(`Authentication required: ${tokenErr.message}`, { cause: tokenErr })
      }

      const resAsset = await mediaService.upload(file, folder, null, {
        onUploadProgress: onProgress,
        onPhase: onStateChange,
        signal,
      })

      onStateChange?.('uploaded')
      return {
        url: resAsset.secureUrl || resAsset.url,
        path: resAsset.publicId || resAsset.path,
        fileName: file.name,
      }
    } catch (err) {
      lastError = err
      if (signal?.aborted) {
        onStateChange?.('failed')
        throw err
      }

      const status = err?.response?.status
      const isAuthError = AUTH_STATUSES.has(status)

      if (isAuthError && attempt < maxRetries) {
        try {
          await attemptTokenRefresh()
          attempt++
          continue
        } catch (refreshErr) {
          const refreshIsNetworkError =
            refreshErr?.message?.includes('Could not refresh') ||
            refreshErr?.message?.includes('Network error') ||
            refreshErr?.cause?.name === 'AbortError' ||
            refreshErr?.cause?.name === 'TypeError'

          if (refreshIsNetworkError) {
            attempt++
            continue
          }

          onStateChange?.('failed')
          throw new Error(`Authentication required: ${refreshErr.message}`, { cause: refreshErr })
        }
      }

      if (!isAuthError && attempt < maxRetries && isRetryableError(err)) {
        attempt++
        continue
      }

      onStateChange?.('failed')
      const fileLabel = file?.name || `file_${attempt}`
      throw new Error(`Image "${fileLabel}" upload failed: ${getErrorMessage(err)}`, { cause: err })
    }
  }

  onStateChange?.('failed')
  throw new Error(`Image "${file?.name || 'unknown'}" upload failed after ${maxRetries} retries: ${getErrorMessage(lastError)}`, { cause: lastError })
}

export async function uploadImageBatch(files, folder = 'portfolio/before', options = {}) {
  const { signal, onImageProgress, onOverallProgress, maxRetries = MAX_RETRIES } = options || {}
  const results = new Array(files.length).fill(null)
  const states = files.map(() => ({ status: 'pending', progress: 0 }))

  const updateState = (idx, status, progress = null) => {
    states[idx] = { status, progress: progress !== null ? progress : states[idx].progress }
    onImageProgress?.(idx, states[idx].progress, files[idx]?.name, status)
  }

  const semaphore = (() => {
    let active = 0
    let waiting = []
    const next = () => {
      if (waiting.length > 0 && active < UPLOAD_CONCURRENCY) {
        active++
        const { resolve } = waiting.shift()
        resolve()
      }
    }
    return {
      acquire: () =>
        new Promise((resolve) => {
          if (active < UPLOAD_CONCURRENCY) {
            active++
            resolve()
          } else {
            waiting.push({ resolve })
          }
        }),
      release: () => {
        active--
        next()
      },
    }
  })()

  const uploadOne = async (idx) => {
    const file = files[idx]

    updateState(idx, 'compressing')

    const result = await uploadSingleImage(file, folder, {
      signal,
      maxRetries,
      onProgress: (p) => {
        updateState(idx, 'uploading', p)
      },
      onStateChange: (state) => {
        updateState(idx, state)
      },
    })

    results[idx] = result
    updateState(idx, 'completed', 100)
  }

  let settled = 0

  const tasks = files.map((_, idx) => {
    return (async () => {
      updateState(idx, 'queued')
      await semaphore.acquire()
      try {
        await uploadOne(idx)
      } catch (err) {
        results[idx] = { error: err, fileName: files[idx]?.name }
        updateState(idx, 'failed', 0)
      } finally {
        settled++
        semaphore.release()
        onOverallProgress?.((settled / files.length) * 100)
      }
    })()
  })

  await Promise.allSettled(tasks)
  return results
}

export async function uploadPortfolioImages(files, imageType, options = {}) {
  const { onImageProgress, onOverallProgress, signal } = options
  const folder = `portfolio/${imageType}`

  await warmServer()

  const results = await uploadImageBatch(files, folder, {
    onImageProgress,
    onOverallProgress,
    signal,
  })

  const successful = []
  const failed = []

  results.forEach((result, idx) => {
    if (result?.url) {
      successful.push({ url: result.url, path: result.path, index: idx })
    } else if (result?.error) {
      failed.push({ error: result.error, file: files[idx], index: idx })
    }
  })

  return { successful, failed, total: files.length }
}