const MAX_RETRIES = 3
const RETRY_DELAY = 1000

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function createUploadFile(file) {
  return {
    file,
    preview: URL.createObjectURL(file),
    progress: { loaded: 0, total: file.size, percentage: 0 },
    status: 'pending'
  }
}

async function uploadWithRetry(file, options, attempt = 1) {
  const { endpoint, fieldName, onProgress, maxRetries = MAX_RETRIES, additionalFields = {} } = options

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value)
    })
    formData.append(fieldName, file.file)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100)
        }
        file.progress = progress
        file.status = 'uploading'
        onProgress?.(file, progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          file.status = 'completed'
          file.progress = { ...file.progress, percentage: 100 }
          onProgress?.(file, file.progress)
          resolve(response)
        } catch {
          reject(new Error('Invalid response format'))
        }
      } else {
        const error = new Error(`Upload failed with status ${xhr.status}`)
        if (attempt < maxRetries) {
          delay(RETRY_DELAY * attempt).then(() => {
            uploadWithRetry(file, options, attempt + 1).then(resolve).catch(reject)
          })
        } else {
          file.status = 'error'
          file.error = error.message
          reject(error)
        }
      }
    })

    xhr.addEventListener('error', () => {
      const error = new Error('Network error during upload')
      if (attempt < maxRetries) {
        delay(RETRY_DELAY * attempt).then(() => {
          uploadWithRetry(file, options, attempt + 1).then(resolve).catch(reject)
        })
      } else {
        file.status = 'error'
        file.error = error.message
        reject(error)
      }
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'))
    })

    xhr.open('POST', endpoint, true)
    const token = localStorage.getItem('hok_access_token')
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    xhr.send(formData)
  })
}

export async function uploadFiles(options) {
  const {
    files,
    endpoint,
    fieldName,
    onFileProgress,
    onFileComplete,
    onFileError,
    onAllComplete,
    maxConcurrent = 3,
    maxRetries = MAX_RETRIES,
    additionalFields = {}
  } = options

  const uploadFiles = files.map(createUploadFile)
  const successful = []
  const failed = []

  async function uploadFile(file) {
    try {
      const response = await uploadWithRetry(file, {
        endpoint,
        fieldName,
        onProgress: onFileProgress,
        maxRetries,
        additionalFields
      })
      file.status = 'completed'
      file.progress = { ...file.progress, percentage: 100 }
      onFileProgress?.(file, file.progress)
      onFileComplete?.(file, response)
      successful.push(file)
    } catch (error) {
      file.status = 'error'
      file.error = error instanceof Error ? error.message : 'Unknown error'
      onFileError?.(file, error instanceof Error ? error : new Error('Unknown error'))
      failed.push(file)
    }
  }

  const queue = [...uploadFiles]
  const running = []

  async function processQueue() {
    while (queue.length > 0 || running.length > 0) {
      while (running.length < maxConcurrent && queue.length > 0) {
        const file = queue.shift()
        const promise = uploadFile(file).finally(() => {
          running.splice(running.indexOf(promise), 1)
        })
        running.push(promise)
      }
      if (running.length > 0) {
        await Promise.race(running)
      }
    }
  }

  await processQueue()
  onAllComplete?.({ successful, failed })
}

export function revokePreviews(files) {
  files.forEach(f => URL.revokeObjectURL(f.preview))
}

export function validateFiles(files, options = {}) {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = ['image/*'], maxCount = 50 } = options
  const valid = []
  const errors = []

  if (files.length > maxCount) {
    errors.push(`Maximum ${maxCount} files allowed`)
    return { valid, errors }
  }

  files.forEach((file) => {
    if (file.size > maxSize) {
      errors.push(`${file.name}: File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
      return
    }

    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })

    if (!isAllowed) {
      errors.push(`${file.name}: File type not allowed`)
      return
    }

    valid.push(file)
  })

  return { valid, errors }
}

export function createDragDropHandlers(onFiles, options = {}) {
  return {
    onDragOver: (e) => {
      e.preventDefault()
      e.stopPropagation()
      options.onDragOver?.()
    },
    onDragLeave: (e) => {
      e.preventDefault()
      e.stopPropagation()
      options.onDragLeave?.()
    },
    onDrop: (e) => {
      e.preventDefault()
      e.stopPropagation()
      options.onDragLeave?.()
      const files = Array.from(e.dataTransfer.files)
      onFiles(files)
    }
  }
}