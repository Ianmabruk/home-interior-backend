import { randomBytes } from 'node:crypto'
import { describe, expect, it } from '@jest/globals'
import sharp from 'sharp'
import { CLOUDINARY_IMAGE_TARGET_BYTES, optimizeImageBuffer } from '../src/uploads/uploadService.js'

describe('Cloudinary image optimization', () => {
  it('re-encodes oversized images even when they are already within the dimension limit', async () => {
    const width = 2048
    const height = 2048
    const source = await sharp(randomBytes(width * height * 3), {
      raw: { width, height, channels: 3 },
    }).png().toBuffer()

    expect(source.length).toBeGreaterThan(CLOUDINARY_IMAGE_TARGET_BYTES)

    const optimized = await optimizeImageBuffer(source, 'image/png', CLOUDINARY_IMAGE_TARGET_BYTES)
    const metadata = await sharp(optimized).metadata()

    expect(optimized.length).toBeLessThanOrEqual(CLOUDINARY_IMAGE_TARGET_BYTES)
    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBeLessThanOrEqual(2048)
    expect(metadata.height).toBeLessThanOrEqual(2048)
  })

  it('leaves images under the upload target unchanged when they need no resizing', async () => {
    const source = await sharp({
      create: { width: 100, height: 100, channels: 3, background: '#ffffff' },
    }).png().toBuffer()

    await expect(
      optimizeImageBuffer(source, 'image/png', CLOUDINARY_IMAGE_TARGET_BYTES),
    ).resolves.toBe(source)
  })
})
