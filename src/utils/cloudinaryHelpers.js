const CLOUDINARY_IMAGE_SEGMENT = '/image/upload/'
const CLOUDINARY_VIDEO_SEGMENT = '/video/upload/'

// Build the Cloudinary transformation string. By default we always request
// `f_auto` (serve WebP/AVIF to capable browsers automatically) and `q_auto`
// (content-aware compression) so every upload is delivered optimized without
// the caller opting in. `width` (optionally with `dpr`) enables responsive
// delivery for the IMAGE ANALYSIS "missing responsive sizes" requirement.
const buildTransformString = (options = {}) => {
  const { width, height, dpr, crop, quality = 'auto', format = 'auto' } = options
  const parts = []
  if (width) parts.push(`w_${width}`)
  if (height) parts.push(`h_${height}`)
  if (dpr) parts.push(`dpr_${dpr}`)
  if (crop) parts.push(`c_${crop}`)
  parts.push(`q_${quality}`)
  parts.push(`f_${format}`)
  return parts.join(',')
}

const isCloudinaryImage = (url) =>
  typeof url === 'string' && url.includes(CLOUDINARY_IMAGE_SEGMENT)

const isCloudinaryVideo = (url) =>
  typeof url === 'string' && url.includes(CLOUDINARY_VIDEO_SEGMENT)

export const getOptimizedUrl = (url, options = {}) => {
  if (!isCloudinaryImage(url)) return url
  const transform = buildTransformString(options)
  if (!transform) return url
  return url.replace(CLOUDINARY_IMAGE_SEGMENT, `${CLOUDINARY_IMAGE_SEGMENT}${transform}/`)
}

// Default responsive widths that cover phones → desktops. Cloudinary generates
// (and caches) each size on first request, so mobiles only ever download the
// small variant they select via `sizes`.
export const RESPONSIVE_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1600]

// Build a `srcset` string of Cloudinary width variants (all f_auto,q_auto).
// Returns '' for non-Cloudinary URLs so callers can safely spread it.
export const buildSrcSet = (url, widths = RESPONSIVE_WIDTHS) => {
  if (!isCloudinaryImage(url)) return ''
  return widths
    .map((w) => `${getOptimizedUrl(url, { width: w, crop: 'limit' })} ${w}w`)
    .join(', ')
}

// ---------- Video ----------

// Optimize a Cloudinary video URL: f_auto (webm/vp9 or h264 as supported) +
// q_auto (adaptive quality). An optional `width` caps the delivered resolution
// so mobile devices receive a smaller stream instead of the full-res master.
export const getOptimizedVideoUrl = (url, options = {}) => {
  if (!isCloudinaryVideo(url)) return url
  const { width, quality = 'auto', format = 'auto' } = options
  const parts = []
  if (width) parts.push(`w_${width}`, 'c_limit')
  parts.push(`q_${quality}`, `f_${format}`)
  return url.replace(CLOUDINARY_VIDEO_SEGMENT, `${CLOUDINARY_VIDEO_SEGMENT}${parts.join(',')}/`)
}

// Derive a lightweight JPG poster frame from a Cloudinary video so the hero
// paints an image instantly (better LCP) before the video buffers, and the
// video does not need to download just to show a first frame.
export const getVideoPosterUrl = (url, options = {}) => {
  if (!isCloudinaryVideo(url)) return undefined
  const { width = 1280 } = options
  const transformed = url.replace(
    CLOUDINARY_VIDEO_SEGMENT,
    `${CLOUDINARY_VIDEO_SEGMENT}so_0,w_${width},c_limit,q_auto,f_auto/`,
  )
  // Swap the video extension for .jpg to request a still frame.
  return transformed.replace(/\.(mp4|webm|mov|m4v|avi)(\?.*)?$/i, '.jpg$2')
}

export default getOptimizedUrl
