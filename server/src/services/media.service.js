import { uploadImage, uploadVideo, deleteMedia } from './uploadService.js'

export const mediaService = {
  async upload({ buffer, mimeType, folder = 'hok/uploads', type = 'image' }) {
    if (type === 'video') {
      return uploadVideo(buffer, folder, mimeType)
    }
    return uploadImage(buffer, folder, mimeType)
  },

  async delete(publicId, resourceType = 'image') {
    return deleteMedia(publicId, resourceType)
  },
}

export default mediaService
