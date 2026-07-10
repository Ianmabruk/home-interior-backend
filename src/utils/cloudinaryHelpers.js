const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/'

// Build the Cloudinary transformation string. By default we always request
// `f_auto` (serve WebP/AVIF to capable browsers automatically) and `q_auto`
// (content-aware compression) so every upload is delivered optimized without
// the caller opting in. `width` (optionally with `dpr`) enables responsive
// delivery for the IMAGE ANALYSIS "missing responsive sizes" requirement.
const buildTransformString = (options = {}) => {
  const { width, height, dpr, quality = 'auto', format = 'auto' } = options
  const parts = []
  if (width) parts.push(`w_${width}`)
  if (height) parts.push(`h_${height}`)
  if (dpr) parts.push(`dpr_${dpr}`)
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
