import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/mediaService', () => ({
  mediaService: { upload: vi.fn() },
}))

import { mediaService } from '../services/mediaService'
import { uploadBlogMediaFile } from '../services/blogMediaUploadService'

describe('blog media upload retry', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('retries a transient failure with the same upload ID', async () => {
    vi.useFakeTimers()
    const file = new File(['image'], 'room.jpg', { type: 'image/jpeg' })
    mediaService.upload
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/blogs/room.jpg',
        publicId: 'blogs/room',
        resourceType: 'image',
      })

    const resultPromise = uploadBlogMediaFile(file, 'stable-upload-id-1234')
    await vi.advanceTimersByTimeAsync(1000)

    await expect(resultPromise).resolves.toMatchObject({ resourceType: 'image' })
    expect(mediaService.upload).toHaveBeenCalledTimes(2)
    expect(mediaService.upload).toHaveBeenNthCalledWith(1, file, 'blogs', 'stable-upload-id-1234')
    expect(mediaService.upload).toHaveBeenNthCalledWith(2, file, 'blogs', 'stable-upload-id-1234')
  })

  it('does not retry a permanent upload rejection', async () => {
    const file = new File(['image'], 'room.jpg', { type: 'image/jpeg' })
    const error = Object.assign(new Error('File type rejected'), { status: 413 })
    mediaService.upload.mockRejectedValue(error)

    await expect(uploadBlogMediaFile(file, 'stable-upload-id-1234')).rejects.toBe(error)
    expect(mediaService.upload).toHaveBeenCalledTimes(1)
  })
})
