import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'
import { MAX_FILE_SIZE_BYTES } from '../constants/upload.js'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v', 'video/x-msvideo', 'video/x-matroska']
const MAX_FILES = 75

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.ogv', '.avi', '.mkv']

const storage = multer.memoryStorage()

function isAllowedFile(file, allowedTypes, allowedExts) {
  if (allowedTypes.includes(file.mimetype)) return true
  if (file.mimetype === 'application/octet-stream' && file.originalname) {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase()
    return allowedExts.includes(ext)
  }
  return false
}

function getAllowedTypesForField(fieldname) {
  if (fieldname === 'video') return ALLOWED_VIDEO_TYPES
  if (['image', 'contentImages', 'homepageCircularImage', 'photo', 'socialMedia'].includes(fieldname)) return ALLOWED_IMAGE_TYPES
  return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]
}

function getAllowedExtensionsForTypes(allowedTypes) {
  return allowedTypes.flatMap((type) => {
    const extension = `.${type.split('/')[1]}`
    if (type === 'video/quicktime') return ['.mov']
    if (type === 'video/x-m4v') return ['.m4v']
    if (type === 'video/x-msvideo') return ['.avi']
    if (type === 'video/x-matroska') return ['.mkv']
    if (type === 'video/ogg') return ['.ogg', '.ogv']
    return extension
  })
}

export const uploadSingle = (field = 'media', allowedTypes = ALLOWED_IMAGE_TYPES) => {
  const allowedExts = allowedTypes
    ? allowedTypes.map((t) => ALLOWED_IMAGE_EXTENSIONS.find((e) => t.includes(e.replace('.', ''))))
    : ALLOWED_IMAGE_EXTENSIONS
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, allowedTypes, allowedExts)) return cb(null, true)
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).single(field)
}

export const uploadFields = (fields) => {
  const allExts = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]
  // Constrain each field to the media it is meant to hold. A video posted to
  // `image` used to be accepted and then stored as an unplayable record.
  // Unknown field names keep the permissive union so mixed fields such as the
  // portfolio `media` slot keep working.
  const perFieldTypes = new Map(fields.map((f) => [f.name, getAllowedTypesForField(f.name)]))
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
    fileFilter: (req, file, cb) => {
      const allowedTypes = perFieldTypes.get(file.fieldname) || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]
      const allowedExts = allowedTypes === undefined ? allExts : getAllowedExtensionsForTypes(allowedTypes)
      if (isAllowedFile(file, allowedTypes, allowedExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type for "${file.fieldname}": ${file.mimetype}`))
    },
  }).fields(fields)
}

export const uploadArray = (field = 'media', maxCount = MAX_FILES) => {
  const allExts = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES], allExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).array(field, maxCount)
}

export const uploadProductImages = (maxCount = 60) => {
  const allExts = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (isAllowedFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES], allExts)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).any()
}

export const uploadProductImagesStrict = (maxCount = 60) => {
  const allExts = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (!isAllowedFile(file, [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES], allExts)) {
        return cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
      }
      const allowed = /^(images|variantImages(_|\[)\d+)$/
      if (!allowed.test(file.fieldname)) {
        return cb(new ApiError(400, `Invalid field name: ${file.fieldname}`))
      }
      cb(null, true)
    },
  }).any()
}
