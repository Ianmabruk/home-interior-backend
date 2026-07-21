import { api } from './api'

export const mediaService = {
  async upload(file, folder = 'hok/uploads', type = 'image') {
    const formData = new FormData()
    formData.append('media', file)
    formData.append('folder', folder)
    formData.append('resourceType', type)

    const response = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async delete(publicId, resourceType = 'image') {
    const response = await api.post('/media/delete', {
      publicId,
      resourceType,
    })
    return response.data
  },

  async testUpload(file) {
    const formData = new FormData()
    formData.append('media', file)

    const response = await api.post('/test-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

export default mediaService
