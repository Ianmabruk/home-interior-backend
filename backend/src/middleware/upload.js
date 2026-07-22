import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_FILES = 10

const storage = multer.memoryStorage()

export const uploadSingle = (field = 'media', allowedTypes = ALLOWED_IMAGE_TYPES) => {
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) return cb(null, true)
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).single(field)
}

export const uploadFields = (fields) => {
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).fields(fields)
}

export const uploadArray = (field = 'media', maxCount = MAX_FILES) => {
  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        return cb(null, true)
      }
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}`))
    },
  }).array(field, maxCount)
}
