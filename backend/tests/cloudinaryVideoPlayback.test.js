import { describe, expect, it, jest } from '@jest/globals'

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'

const { default: cloudinary, uploadToCloudinary } = await import('../src/config/cloudinary.js')
const { blogService } = await import('../src/services/blogService.js')

describe('Cloudinary video playback uploads', () => {
  it('rejects a video when Cloudinary did not return the compatible eager MP4', async () => {
    let uploadOptions
    const uploadSpy = jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((options, callback) => {
      uploadOptions = options
      return {
        end: () => callback(null, {
          secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v123/blogs/clip.mp4',
          public_id: 'blogs/clip',
          resource_type: 'video',
          format: 'mp4',
          bytes: 900000,
        }),
      }
    })

    try {
      await expect(blogService.createBlog(
        { title: 'Video without transcode', slug: 'video-without-transcode' },
        null,
        { buffer: Buffer.from('video-data'), mimetype: 'video/mp4', originalname: 'clip.mp4' },
      )).rejects.toMatchObject({
        status: 422,
        message: expect.stringContaining('compatible H.264/AAC MP4'),
      })

      expect(uploadOptions.resource_type).toBe('video')
      expect(uploadOptions.eager_async).toBe(false)
      expect(uploadOptions.eager[0]).toMatchObject({
        format: 'mp4',
        video_codec: { codec: 'h264', profile: 'baseline', level: '3.1' },
        audio_codec: 'aac',
        pixel_format: 'yuv420p',
      })
    } finally {
      uploadSpy.mockRestore()
    }
  })

  it('uses the generated H.264/AAC MP4 when Cloudinary returns it', async () => {
    const eagerUrl = 'https://res.cloudinary.com/test-cloud/video/upload/f_mp4,vc_h264:baseline:3.1,ac_aac/v123/blogs/clip.mp4'
    const uploadSpy = jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((options, callback) => ({
      end: () => callback(null, {
        secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v123/blogs/clip.mp4',
        public_id: 'blogs/clip',
        resource_type: 'video',
        format: 'mp4',
        bytes: 900000,
        eager: [{ secure_url: eagerUrl, format: 'mp4' }],
      }),
    }))

    try {
      const uploaded = await uploadToCloudinary(Buffer.from('video-data'), 'video/mp4', 'blogs', 'clip.mp4')

      expect(uploaded.url).toBe(eagerUrl)
      expect(uploaded.originalUrl).not.toBe(uploaded.url)
      expect(uploaded.format).toBe('mp4')
    } finally {
      uploadSpy.mockRestore()
    }
  })
})
