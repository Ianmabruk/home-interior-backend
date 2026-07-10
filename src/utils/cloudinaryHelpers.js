const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/'

const buildTransformString = (options = {}) => {
  const { width, quality = 'auto', format = 'auto' } = options
  const parts = []
  if (width) parts.push(`w_${width}`)
  parts.push(`q_${quality}`)
  parts.push(`f_${format}`)
  return parts.join(',')
}

export const getOptimizedUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url
  if (!url.includes(CLOUDINARY_UPLOAD_SEGMENT)) return url

  const transform = buildTransformString(options)
  if (!transform) return url

  return url.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${transform}/`)
}

export default getOptimizedUrl
