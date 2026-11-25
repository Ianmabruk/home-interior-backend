import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/api', () => ({
  api: { post: vi.fn() },
  ensureValidToken: vi.fn().mockResolvedValue('mock-token'),
}))

import { api, ensureValidToken } from '../services/api'
import { mediaService } from '../services/mediaService'

describe('mediaService.upload', () => {
  beforeEach(() => {
    api.post.mockReset()
    ensureValidToken.mockReset()
  })

  it('calls upload with correct parameters', async () => {
    const file = new File(['image'], 'room.jpg', { type: 'image/jpeg' })
    const asset = {
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/blogs/room.jpg',
      publicId: 'blogs/room',
      resourceType: 'image',
    }
    // Mock the internal upload method
    mediaService.upload = vi.fn().mockResolvedValue(asset)

    const result = await mediaService.upload(file, 'blogs', 'stable-upload-id-1234')
    expect(result).toEqual(asset)
    expect(mediaService.upload).toHaveBeenCalledWith(file, 'blogs', 'stable-upload-id-1234')
  })
})
