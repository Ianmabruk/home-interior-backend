import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'
import { MAX_FILE_SIZE_BYTES, MAX_VIDEO_FILE_SIZE_BYTES } from '../constants/upload.js'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
  'video/webm', 'video/x-flv', 'video/x-ms-wmv', 'video/mpeg',
  'video/mp2t', 'application/octet-stream',
]
const MAX_FILES = 1000

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']
const ALLOWED_VIDEO_EXTENSIONS = [
  '.mp4', '.m4v', '.mov', '.avi', '.mkv', '.webm', '.flv',
  '.wmv', '.mpeg', '.mpg', '.mts', '.m2ts', '.mxf',
]

const storage = multer.memoryStorage()

function isAllowedFile(file, allowedTypes, allowedExts) {
  if (allowedTypes.includes(file.mimetype)) return true
  if (file.mimetype === 'application/octet-stream' && file.originalname) {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase()
    return allowedExts.includes(ext)
  }
  return false
}

function getAllowedExtensionsForTypes(allowedTypes) {
  return allowedTypes.flatMap((type) => {
    if (type === 'image/jpeg') return ['.jpg', '.jpeg']
    if (type === 'video/mp4') return ['.mp4', '.m4v']
    if (type === 'video/quicktime') return ['.mov']
    if (type === 'video/x-msvideo') return ['.avi']
    if (type === 'video/x-matroska') return ['.mkv']
    if (type === 'video/webm') return ['.webm']
    if (type === 'video/x-flv') return ['.flv']
    if (type === 'video/x-ms-wmv') return ['.wmv']
    if (type === 'video/mpeg') return ['.mpeg', '.mpg']
    if (type === 'video/mp2t') return ['.mts', '.m2ts', '.mxf']
    return `.${type.split('/')[1]}`
  })
}

export const uploadSingle = (field = 'media', allowedTypes = ALLOWED_IMAGE_TYPES) => {
  const allowedExts = allowedTypes ? getAllowedExtensionsForTypes(allowedTypes) : ALLOWED_IMAGE_EXTENSIONS
  const isVideoField = field === 'video' || (allowedTypes && allowedTypes.some(t => t.startsWith('video/')))
  const fileSizeLimit = isVideoField ? MAX_VIDEO_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES
  return multer({
    storage,
    limits: { fileSize: fileSizeLimit },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, allowedTypes, allowedExts)) return cb(null, true)
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).single(field)
}

export const uploadFields = (fields) => {
  const perFieldTypes = new Map()
  const perFieldSizeLimits = new Map()
  for (const f of fields) {
    if (f.name === 'video') {
      perFieldTypes.set(f.name, ALLOWED_VIDEO_TYPES)
      perFieldSizeLimits.set(f.name, MAX_VIDEO_FILE_SIZE_BYTES)
    } else {
      perFieldTypes.set(f.name, ALLOWED_IMAGE_TYPES)
      perFieldSizeLimits.set(f.name, MAX_FILE_SIZE_BYTES)
    }
  }
  return multer({
    storage,
    limits: { fileSize: MAX_VIDEO_FILE_SIZE_BYTES, files: MAX_FILES },
    fileFilter: (req, file, cb) => {
      const allowedTypes = perFieldTypes.get(file.fieldname) || ALLOWED_IMAGE_TYPES
      const allowedExts = getAllowedExtensionsForTypes(allowedTypes)
      const sizeLimit = perFieldSizeLimits.get(file.fieldname) || MAX_FILE_SIZE_BYTES
      if (file.size > sizeLimit) {
        const limitMB = sizeLimit / 1024 / 1024
        return cb(new ApiError(400, `File "${file.originalname}" exceeds the maximum allowed size of ${limitMB} MB for ${file.fieldname}`))
      }
      if (isAllowedFile(file, allowedTypes, allowedExts)) {
        return cb(null, true)
      }
      const isVideoField = file.fieldname === 'video'
      cb(new ApiError(400, `Invalid file type for "${file.fieldname}": ${file.mimetype}. Only ${isVideoField ? 'videos' : 'images'} are accepted.`))
    },
  }).fields(fields)
}

export const uploadArray = (field = 'media', maxCount = MAX_FILES, allowedTypes = ALLOWED_IMAGE_TYPES) => {
  const allowedExts = getAllowedExtensionsForTypes(allowedTypes)
  const isVideoField = field === 'video' || (allowedTypes && allowedTypes.some(t => t.startsWith('video/')))
  const fileSizeLimit = isVideoField ? MAX_VIDEO_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES
  return multer({
    storage,
    limits: { fileSize: fileSizeLimit, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, allowedTypes, allowedExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Only images are accepted.`))
    },
  }).array(field, maxCount)
}

export const uploadProductImages = (maxCount = 60) => {
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Only images are accepted.`))
    },
  }).any()
}

export const uploadProductImagesStrict = (maxCount = 60) => {
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (!isAllowedFile(file, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS)) {
        return cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Only images are accepted.`))
      }
      const fn = file.fieldname
      const isValidField = fn === 'images' || /^variantImages[_(\[]\d+/.test(fn)
      if (!isValidField) {
        return cb(new ApiError(400, `Invalid field name: ${file.fieldname}`))
      }
      cb(null, true)
    },
  }).any()
}