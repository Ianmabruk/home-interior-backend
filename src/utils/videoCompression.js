import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance = null
let ffmpegLoadPromise = null

const VIDEO_COMPRESSION_CONFIG = {
  targetSizeMB: 140,
  maxDurationSeconds: 3600,
  videoCodec: 'libx264',
  audioCodec: 'aac',
  preset: 'medium',
  crf: 28,
  maxWidth: 1920,
  maxHeight: 1080,
}

async function loadFFmpegCore(onProgress) {
  if (ffmpegInstance) return ffmpegInstance

  if (ffmpegLoadPromise) return ffmpegLoadPromise

  ffmpegLoadPromise = (async () => {
    const ffmpeg = new FFmpeg()

    ffmpeg.on('log', ({ message }) => {
      if (onProgress) {
        const progressMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (progressMatch) {
          const hours = parseInt(progressMatch[1], 10)
          const minutes = parseInt(progressMatch[2], 10)
          const seconds = parseFloat(progressMatch[3])
          const totalSeconds = hours * 3600 + minutes * 60 + seconds
          onProgress(Math.min(99, Math.round((totalSeconds / VIDEO_COMPRESSION_CONFIG.maxDurationSeconds) * 100)))
        }
      }
    })

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}ffmpeg-core.worker.js`, 'text/javascript'),
    })

    ffmpegInstance = ffmpeg
    return ffmpeg
  })()

  return ffmpegLoadPromise
}

export async function compressVideo(file, options = {}, onProgress) {
  const config = { ...VIDEO_COMPRESSION_CONFIG, ...options }

  if (!file || !file.type.startsWith('video/')) {
    throw new Error('Invalid video file')
  }

  if (file.size <= config.targetSizeMB * 1024 * 1024) {
    return { file, compressed: false, originalSize: file.size, compressedSize: file.size }
  }

  onProgress?.(5)

  const ffmpeg = await loadFFmpegCore((progress) => {
    onProgress?.(5 + Math.round(progress * 0.85))
  })

  const inputName = `input_${Date.now()}${getFileExtension(file.name)}`
  const outputName = `output_${Date.now()}.mp4`

  try {
    const inputData = await fetchFile(file)
    ffmpeg.writeFile(inputName, inputData)

    const { width, height } = await getVideoDimensions(ffmpeg, inputName)
    const scaleFilter = calculateScaleFilter(width, height, config.maxWidth, config.maxHeight)

    const args = [
      '-i', inputName,
      '-vf', scaleFilter,
      '-c:v', config.videoCodec,
      '-preset', config.preset,
      '-crf', String(config.crf),
      '-c:a', config.audioCodec,
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-max_muxing_queue_size', '1024',
      outputName,
    ]

    onProgress?.(10)
    await ffmpeg.exec(args)
    onProgress?.(95)

    const data = ffmpeg.readFile(outputName)
    const compressedBlob = new Blob([data], { type: 'video/mp4' })
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.mp4'), {
      type: 'video/mp4',
      lastModified: file.lastModified,
    })

    onProgress?.(100)

    return {
      file: compressedFile,
      compressed: true,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      originalWidth: width,
      originalHeight: height,
    }
  } catch (error) {
    console.error('[videoCompression] Compression failed:', error)
    throw new Error(`Video compression failed: ${error.message}`, { cause: error })
  } finally {
    try {
      ffmpeg.deleteFile(inputName)
    } catch { /* ignore */ }
    try {
      ffmpeg.deleteFile(outputName)
    } catch { /* ignore */ }
  }
}

async function getVideoDimensions(ffmpeg, inputName) {
  const outputName = 'probe.txt'
  await ffmpeg.exec([
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'csv=p=0',
    inputName,
    '-o', outputName,
  ])
  const outputData = ffmpeg.readFile(outputName)
  const output = new TextDecoder().decode(outputData).trim()
  const [width, height] = output.split(',').map(Number)
  try { ffmpeg.deleteFile(outputName) } catch { /* ignore */ }
  return { width: width || 1920, height: height || 1080 }
}

function calculateScaleFilter(width, height, maxWidth, maxHeight) {
  if (width <= maxWidth && height <= maxHeight) {
    return 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
  }
  const scaleW = maxWidth / width
  const scaleH = maxHeight / height
  const scale = Math.min(scaleW, scaleH)
  const newWidth = Math.round(width * scale)
  const newHeight = Math.round(height * scale)
  return `scale=${newWidth}:${newHeight}:force_original_aspect_ratio=decrease,pad=${maxWidth}:${maxHeight}:(ow-iw)/2:(oh-ih)/2`
}

function getFileExtension(filename) {
  const parts = filename.split('.')
  return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '.mp4'
}

export function estimateCompressedSize(originalSize, duration, targetBitrate = null) {
  if (!duration || duration <= 0) return originalSize
  const estimatedBitrate = targetBitrate || (originalSize * 8) / duration
  const targetBitrateKbps = Math.min(estimatedBitrate, 5000)
  return Math.round((targetBitrateKbps * duration) / 8)
}

export function canCompressInBrowser() {
  return (
    typeof window !== 'undefined' &&
    typeof SharedArrayBuffer !== 'undefined' &&
    navigator.hardwareConcurrency >= 2
  )
}

export async function getVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      })
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }
  })
}