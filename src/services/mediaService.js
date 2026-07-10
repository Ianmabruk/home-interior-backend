import { api } from './api'

// Centralized media service. Every admin module uploads and deletes media
// through these three functions so Cloudinary usage stays consistent and the
// underlying endpoint can change without touching call sites.
//
//   uploadImage(file, options)
//   uploadVideo(file, options)
//   deleteMedia(publicId, resourceType)
//
// `uploadImage` / `uploadVideo` accept a browser File and POST it (as
// multipart form-data) to the backend, which streams it to Cloudinary with
// f_auto,q_auto handling and retries. They return { url, publicId, resourceType }.

const UPLOAD_ENDPOINT = '/content/media/upload'
const DELETE_ENDPOINT = '/content/media/delete'

const upload = (file, { folder = 'hok/uploads', resourceType = 'image', onProgress } = {}) => {
  const form = new FormData()
  form.append('media', file)
  form.append('folder', folder)
  form.append('resourceType', resourceType)

  return api
    .post(UPLOAD_ENDPOINT, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
    .then((res) => res.data)
}

export const uploadImage = (file, options = {}) =>
  upload(file, { ...options, resourceType: 'image' })

export const uploadVideo = (file, options = {}) =>
  upload(file, { ...options, resourceType: 'video' })

export const deleteMedia = (publicId, resourceType = 'image') =>
  api
    .post(DELETE_ENDPOINT, { publicId, resourceType })
    .then((res) => res.data)

export const mediaService = { uploadImage, uploadVideo, deleteMedia }
export default mediaService
