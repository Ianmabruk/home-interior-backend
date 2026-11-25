import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { UploadCloud, X, Trash2, Video, AlertCircle, RotateCcw } from 'lucide-react'
import { api } from '../../services/api'
import { createBlogUploadId, uploadBlogMediaFile } from '../../services/blogMediaUploadService'
import { UPLOAD_STAGES } from '../../services/mediaService'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { slugify, getReadingTime } from '../../utils/blogHelpers'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../../utils/uploadConfig'

const FORMAT_COMMANDS = [
  { tag: 'h2', label: 'H2', title: 'Heading 2' },
  { tag: 'h3', label: 'H3', title: 'Heading 3' },
  { tag: 'strong', label: 'B', title: 'Bold' },
  { tag: 'em', label: 'I', title: 'Italic' },
  { tag: 'u', label: 'U', title: 'Underline' },
  { tag: 'code', label: '<>', title: 'Code' },
]

const PREDEFINED_CATEGORIES = [
  'Interior Design', 'Architecture', 'Furniture', 'Lighting',
  'Color', 'Materials', 'Trends', 'DIY', 'Sustainability', 'Virtual Design',
]

const isContentVideo = (file) => file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|ogv|ogg)$/i.test(file.name)
const isVideoUrl = (url) => typeof url === 'string' && url.includes('/video/upload/')

const INITIAL_FORM = {
  title: '',
  subtitle: '',
  slug: '',
  description: '',
  content: '',
  category: '',
  tags: '',
  author: '',
  metaDescription: '',
  published: false,
  featured: false,
  displayOrder: 0,
  publishDate: '',
}

const STAGE_LABELS = {
  [UPLOAD_STAGES.FILE_VALIDATION]: 'Validating file',
  [UPLOAD_STAGES.IMAGE_COMPRESSION]: 'Compressing image',
  [UPLOAD_STAGES.VIDEO_VALIDATION]: 'Validating video',
  [UPLOAD_STAGES.SIGNATURE_GENERATION]: 'Generating upload signature',
  [UPLOAD_STAGES.AUTHENTICATION]: 'Authenticating',
  [UPLOAD_STAGES.CLOUDINARY_UPLOAD]: 'Uploading to media storage',
  [UPLOAD_STAGES.CLOUDINARY_PROCESSING]: 'Processing media',
  [UPLOAD_STAGES.DATABASE_SAVE]: 'Saving media reference',
  [UPLOAD_STAGES.BLOG_PUBLISHING]: 'Publishing blog',
}

function getStageMessage(stage) {
  return STAGE_LABELS[stage] || stage
}

export const BlogForm = ({ blog, onSaved, onCancel }) => {
  const isEdit = Boolean(blog)
  const [form, setForm] = useState(() => {
    const base = { ...INITIAL_FORM }
    if (blog) {
      const entries = {
        title: blog.title || '',
        subtitle: blog.subtitle || '',
        slug: blog.slug || '',
        description: blog.description || '',
        content: blog.content || '',
        category: blog.category || '',
        tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
        author: blog.author || '',
        metaDescription: blog.metaDescription || '',
        published: blog.published || false,
        featured: blog.featured || false,
        displayOrder: blog.displayOrder || 0,
        publishDate: blog.publishDate ? new Date(blog.publishDate).toISOString().split('T')[0] : '',
      }
      Object.assign(base, entries)
    }
    return base
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(blog?.image || null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(blog?.video || null)
  const [videoPreviewError, setVideoPreviewError] = useState(false)
  const [removeVideo, setRemoveVideo] = useState(false)
  const [videoAsset, setVideoAsset] = useState(null)
  const [contentFiles, setContentFiles] = useState([])
  const [existingContentImages, setExistingContentImages] = useState(blog?.mediaUrls ? [...blog.mediaUrls] : [])
  const [removeMediaUrls, setRemoveMediaUrls] = useState([])
  const [imageUploadId, setImageUploadId] = useState(null)
  const [imageAsset, setImageAsset] = useState(null)
  const [imageUploadError, setImageUploadError] = useState(null)
  const [imageUploadStage, setImageUploadStage] = useState(null)
  const [imageUploadProgress, setImageUploadProgress] = useState(0)
  const [videoUploadError, setVideoUploadError] = useState(null)
  const [videoUploadStage, setVideoUploadStage] = useState(null)
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const imageInputRef = useRef(null)
  const videoRef = useRef(null)
  const contentInputRef = useRef(null)
  const submissionLockRef = useRef(false)
  const contentFilesRef = useRef(contentFiles)
  const contentCancelRefs = useRef(new Map())

  useEffect(() => {
    contentFilesRef.current = contentFiles
  }, [contentFiles])

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
    }
  }, [imagePreview, videoPreview])

  useEffect(() => () => {
    contentCancelRefs.current.forEach((cancelers) => {
      cancelers.abort?.()
    })
    contentCancelRefs.current.clear()
    contentFilesRef.current.forEach(({ preview }) => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    })
  }, [])

  const validateFile = useCallback((file, field) => {
    if (!file) return 'No file provided'
    if (file.size === 0) return 'The selected file is empty'

    const maxVideoBytes = 5 * 1024 * 1024 * 1024
    if (field === 'video' ? file.size > maxVideoBytes : file.size > MAX_FILE_SIZE_BYTES) {
      return field === 'video'
        ? 'Video exceeds the maximum allowed size of 5 GB'
        : `File exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB} MB`
    }

    if (field === 'image') {
      if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|avif)$/i.test(file.name)) {
        return 'Please select a valid image file'
      }
    } else if (field === 'video') {
      if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm|avi|mkv|3gp|ogv|ogg)$/i.test(file.name)) {
        return 'Please select a valid video file'
      }
    } else if (field === 'content') {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !/\.(jpe?g|png|webp|gif|avif|mp4|mov|m4v|webm|avi|mkv|3gp|ogv|ogg)$/i.test(file.name)) {
        return `"${file.name}" is not a supported media file`
      }
      if (isContentVideo(file)) {
        if (file.size > 5 * 1024 * 1024 * 1024) {
          return `Video "${file.name}" exceeds the 5 GB limit`
        }
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        return `File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB content media limit`
      }
    }
    return null
  }, [])

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    const validationError = validateFile(file, field)
    if (validationError) {
      toast.error(validationError)
      e.target.value = ''
      return
    }

    if (field === 'image') {
      setImageFile(file)
      setImageAsset(null)
      setImageUploadId(createBlogUploadId())
      setImageUploadError(null)
      setImageUploadStage(null)
      setImageUploadProgress(0)
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    } else if (field === 'video') {
      setVideoFile(file)
      setVideoAsset(null)
      setVideoUploadError(null)
      setVideoUploadStage(null)
      setVideoUploadProgress(0)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
      setVideoPreviewError(false)
    }
    e.target.value = ''
  }

  const handleContentImagesChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    const emptyFile = selected.find((file) => file.size === 0)
    if (emptyFile) {
      toast.error(`File "${emptyFile.name}" is empty`)
      e.target.value = ''
      return
    }

    const invalidType = selected.find((file) => validateFile(file, 'content'))
    if (invalidType) {
      toast.error(`"${invalidType.name}" is not a supported media file`)
      e.target.value = ''
      return
    }

    const newItems = selected.map((file) => ({
      id: createBlogUploadId(),
      file,
      preview: URL.createObjectURL(file),
      uploadId: createBlogUploadId(),
      asset: null,
      status: 'pending',
      error: null,
      stage: null,
      progress: 0,
    }))
    setContentFiles((prev) => [...prev, ...newItems])
    e.target.value = ''
  }

  const handleRemoveContentImage = (index) => {
    const item = contentFiles[index]
    contentCancelRefs.current.get(item?.id)?.abort?.()
    contentCancelRefs.current.delete(item?.id)
    if (item?.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview)
    setContentFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingContentImage = (url) => {
    setExistingContentImages((prev) => prev.filter((u) => u !== url))
    setRemoveMediaUrls((prev) => {
      if (prev.includes(url)) return prev
      return [...prev, url]
    })
  }

  const handleRemovePreview = (field) => {
    if (field === 'image') {
      setImageFile(null)
      setImageAsset(null)
      setImageUploadId(null)
      setImageUploadError(null)
      setImageUploadStage(null)
      setImageUploadProgress(0)
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    } else if (field === 'video') {
      setVideoFile(null)
      setVideoAsset(null)
      setVideoUploadError(null)
      setVideoUploadStage(null)
      setVideoUploadProgress(0)
      if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
      setVideoPreviewError(false)
      setRemoveVideo(true)
    }
  }

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'title' && !form.slug && !isEdit) {
      setForm((prev) => ({ ...prev, slug: slugify(value) }))
    }
  }

  const applyFormat = (tag) => {
    const textarea = document.getElementById('blog-content-editor')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end)
    if (!selected) return

    const replacement = `<${tag}>${selected}</${tag}>`
    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end)
    setForm((prev) => ({ ...prev, content: newValue }))
    setTimeout(() => {
      textarea.setSelectionRange(start + replacement.length, start + replacement.length)
      textarea.focus()
    }, 0)
  }

  const createUploadHandlers = useCallback((itemId, isFeatured, isVideo) => {
    let aborted = false
    const abortController = new AbortController()

    const handlers = {
      onPhase: (phase) => {
        if (aborted) return
        const label = getStageMessage(phase)
        if (isFeatured) {
          if (isVideo) {
            setVideoUploadStage(label)
          } else {
            setImageUploadStage(label)
          }
        } else {
          setContentFiles((prev) => prev.map((entry) =>
            entry.id === itemId ? { ...entry, status: label, stage: label } : entry
          ))
        }
      },
      onUploadProgress: (progress) => {
        if (aborted) return
        if (isFeatured) {
          if (isVideo) {
            setVideoUploadProgress(progress)
          } else {
            setImageUploadProgress(progress)
          }
        } else {
          setContentFiles((prev) => prev.map((entry) =>
            entry.id === itemId ? { ...entry, progress } : entry
          ))
        }
      },
      setCancel: (cancel) => {
        const cancelers = contentCancelRefs.current.get(itemId) || {}
        contentCancelRefs.current.set(itemId, { ...cancelers, abort: cancel })
      },
      signal: abortController.signal,
      abort: () => {
        aborted = true
        abortController.abort()
      },
    }
    return handlers
  }, [])

  const uploadPendingMedia = async () => {
    const pending = []
    let uploadedImageAsset = imageAsset
    let uploadedVideoAsset = videoAsset
    const uploadedContentAssets = new Map()
    const failed = []

    if (imageFile && !imageAsset) {
      pending.push({
        id: 'featured-image',
        file: imageFile,
        uploadId: imageUploadId,
        type: 'featured',
        isVideo: false,
      })
    }
    if (videoFile && !videoAsset) {
      pending.push({
        id: 'featured-video',
        file: videoFile,
        uploadId: createBlogUploadId(),
        type: 'featured-video',
        isVideo: true,
      })
    }
    contentFiles.forEach((item) => {
      if (item.asset) {
        uploadedContentAssets.set(item.id, item.asset)
      } else {
        pending.push({ ...item, type: 'content', isVideo: isContentVideo(item.file) })
      }
    })

    if (pending.length === 0) {
      return {
        imageAsset: uploadedImageAsset,
        videoAsset: uploadedVideoAsset,
        mediaAssets: contentFiles.map((item) => item.asset).filter(Boolean),
        failed,
      }
    }

    setUploadingMedia(true)
    setImageUploadError(null)
    setVideoUploadError(null)

    const processQueue = async (queue, concurrency) => {
      let cursor = 0
      const worker = async () => {
        while (cursor < queue.length) {
          const item = queue[cursor]
          if (!item) break
          cursor += 1

          if (item.type === 'featured') {
            setImageUploadError(null)
          } else if (item.type === 'featured-video') {
            setVideoUploadError(null)
          } else {
            setContentFiles((prev) => prev.map((entry) =>
              entry.id === item.id ? { ...entry, status: 'uploading', error: null } : entry
            ))
          }

          try {
            const handlers = createUploadHandlers(item.id, item.type === 'featured' || item.type === 'featured-video', item.isVideo)
            const asset = await uploadBlogMediaFile(item.file, item.uploadId, handlers)
            contentCancelRefs.current.delete(item.id)

            if (item.type === 'featured') {
              uploadedImageAsset = asset
              setImageAsset(asset)
              setImagePreview(asset.secureUrl)
              setImageUploadStage('Upload complete')
              setImageUploadProgress(100)
            } else if (item.type === 'featured-video') {
              uploadedVideoAsset = asset
              setVideoAsset(asset)
              setVideoPreview(asset.secureUrl)
              setVideoUploadStage('Upload complete')
              setVideoUploadProgress(100)
            } else {
              uploadedContentAssets.set(item.id, asset)
              setContentFiles((prev) => prev.map((entry) =>
                entry.id === item.id
                  ? {
                      ...entry,
                      asset,
                      preview: asset.secureUrl || entry.preview,
                      status: 'uploaded',
                      error: null,
                      progress: 100,
                    }
                  : entry
              ))
            }
          } catch (uploadError) {
            if (uploadError?.name === 'AbortError' || uploadError?.code === 'ERR_CANCELED') {
              return
            }
            const message = uploadError?.message || 'Upload failed'
            const stage = uploadError?.stage ? getStageMessage(uploadError.stage) : 'Upload failed'
            const retryable = uploadError?.retryable === true
            const errorDetail = retryable ? `${message} (${stage})` : message

            failed.push({ fileName: item.file.name, message: errorDetail, retryable, stage: uploadError?.stage })

            if (item.type === 'featured' || item.type === 'featured-video') {
              if (item.isVideo) {
                setVideoUploadError(errorDetail)
                setVideoUploadStage(null)
              } else {
                setImageUploadError(errorDetail)
                setImageUploadStage(null)
              }
            } else {
              setContentFiles((prev) => prev.map((entry) =>
                entry.id === item.id ? { ...entry, status: 'failed', error: errorDetail, retryable, stage: uploadError?.stage } : entry
              ))
            }
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
    }

    try {
      const imageQueue = pending.filter((item) => !item.isVideo)
      const videoQueue = pending.filter((item) => item.isVideo)
      await processQueue(imageQueue, 3)
      await processQueue(videoQueue, 1)
    } finally {
      setUploadingMedia(false)
    }

    return {
      imageAsset: uploadedImageAsset,
      videoAsset: uploadedVideoAsset,
      mediaAssets: contentFiles.map((item) => uploadedContentAssets.get(item.id) || item.asset).filter(Boolean),
      failed,
    }
  }

  const retryContentUpload = async (itemId) => {
    const item = contentFiles.find((entry) => entry.id === itemId)
    if (!item || uploadingMedia || submitting) return

    setUploadingMedia(true)
    setContentFiles((prev) => prev.map((entry) =>
      entry.id === itemId ? { ...entry, status: 'uploading', error: null, retryable: false } : entry
    ))

    try {
      const handlers = createUploadHandlers(itemId, false, item.isVideo)
      const asset = await uploadBlogMediaFile(item.file, item.uploadId, handlers)
      contentCancelRefs.current.delete(item.id)
      setContentFiles((prev) => prev.map((entry) =>
        entry.id === itemId
          ? {
              ...entry,
              asset,
              preview: asset.secureUrl || entry.preview,
              status: 'uploaded',
              error: null,
              retryable: false,
              progress: 100,
            }
          : entry
      ))
    } catch (uploadError) {
      if (uploadError?.name === 'AbortError' || uploadError?.code === 'ERR_CANCELED') return
      const message = uploadError?.message || 'Upload failed'
      const stage = uploadError?.stage ? getStageMessage(uploadError.stage) : 'Upload failed'
      const retryable = uploadError?.retryable === true
      const errorDetail = retryable ? `${message} (${stage})` : message
      setContentFiles((prev) => prev.map((entry) =>
        entry.id === itemId ? { ...entry, status: 'failed', error: errorDetail, retryable, stage: uploadError?.stage } : entry
      ))
    } finally {
      setUploadingMedia(false)
    }
  }

  const retryFeaturedImageUpload = async () => {
    if (!imageFile || !imageUploadId || uploadingMedia || submitting) return
    setUploadingMedia(true)
    setImageUploadError(null)
    setImageUploadStage(null)
    setImageUploadProgress(0)
    try {
      const handlers = createUploadHandlers('featured-image', true, false)
      const asset = await uploadBlogMediaFile(imageFile, imageUploadId, handlers)
      setImageAsset(asset)
      setImagePreview(asset.secureUrl)
    } catch (uploadError) {
      if (uploadError?.name === 'AbortError' || uploadError?.code === 'ERR_CANCELED') return
      const message = uploadError?.message || 'Upload failed'
      const stage = uploadError?.stage ? getStageMessage(uploadError.stage) : 'Upload failed'
      const retryable = uploadError?.retryable === true
      setImageUploadError(retryable ? `${message} (${stage})` : message)
    } finally {
      setUploadingMedia(false)
    }
  }

  const retryFeaturedVideoUpload = async () => {
    if (!videoFile || uploadingMedia || submitting) return
    setUploadingMedia(true)
    setVideoUploadError(null)
    setVideoUploadStage(null)
    setVideoUploadProgress(0)
    try {
      const handlers = createUploadHandlers('featured-video', true, true)
      const asset = await uploadBlogMediaFile(videoFile, createBlogUploadId(), handlers)
      setVideoAsset(asset)
      setVideoPreview(asset.secureUrl)
    } catch (uploadError) {
      if (uploadError?.name === 'AbortError' || uploadError?.code === 'ERR_CANCELED') return
      const message = uploadError?.message || 'Upload failed'
      const stage = uploadError?.stage ? getStageMessage(uploadError.stage) : 'Upload failed'
      const retryable = uploadError?.retryable === true
      setVideoUploadError(retryable ? `${message} (${stage})` : message)
    } finally {
      setUploadingMedia(false)
    }
  }

  const cancelContentUpload = (itemId) => {
    const cancelers = contentCancelRefs.current.get(itemId)
    cancelers?.abort?.()
  }

  const handleSubmit = async (e, status) => {
    e.preventDefault()
    if (submitting || submissionLockRef.current) return
    submissionLockRef.current = true
    setError(null)

    const title = (form.title || '').trim()
    if (!title) {
      submissionLockRef.current = false
      setError('Title is required')
      return
    }

    setSubmitting(true)

    try {
      const uploads = await uploadPendingMedia()
      if (uploads.failed.length > 0) {
        const nonRetryable = uploads.failed.filter(f => !f.retryable)
        if (nonRetryable.length > 0) {
          throw new Error(`${nonRetryable.length} media upload${nonRetryable.length === 1 ? '' : 's'} failed permanently. ${nonRetryable.map(f => `${f.fileName}: ${f.message}`).join('; ')}`)
        }
        throw new Error(`${uploads.failed.length} media upload${uploads.failed.length === 1 ? '' : 's'} failed. Retry the failed file${uploads.failed.length === 1 ? '' : 's'} before publishing.`)
      }

      const formData = new FormData()
      formData.append('title', title)
      formData.append('subtitle', form.subtitle || '')
      formData.append('slug', form.slug || slugify(title))
      formData.append('description', form.description || '')
      formData.append('content', form.content || '')
      formData.append('category', form.category || '')
      formData.append('tags', form.tags || '')
      formData.append('author', form.author || '')
      formData.append('metaDescription', form.metaDescription || '')
      formData.append('published', String(status === 'publish' ? true : form.published))
      formData.append('featured', String(Boolean(form.featured)))
      formData.append('displayOrder', String(Number(form.displayOrder) || 0))
      if (form.publishDate) formData.append('publishDate', form.publishDate)
      if (imageFile) formData.append('imageAsset', JSON.stringify(uploads.imageAsset))
      if (videoFile) formData.append('videoAsset', JSON.stringify(uploads.videoAsset))
      if (removeVideo) formData.append('removeVideo', 'true')
      if (uploads.mediaAssets.length > 0) formData.append('mediaAssets', JSON.stringify(uploads.mediaAssets))
      if (removeMediaUrls.length > 0) formData.append('removeMediaUrls', JSON.stringify(removeMediaUrls))
      if (imageFile && !uploads.imageAsset) formData.append('image', imageFile)
      if (videoFile && !uploads.videoAsset) formData.append('video', videoFile)
      contentFiles.forEach((item) => {
        if (!item.asset && item.file) {
          formData.append('contentImages', item.file)
        }
      })

      let res
      if (isEdit) {
        res = await api.patch(`/admin/blog/${blog.id}`, formData)
      } else {
        res = await api.post('/admin/blog', formData)
      }

      toast.success(`Blog ${isEdit ? 'updated' : 'created'} successfully`)
      dispatchAdminDataChanged('blog-changed')
      onSaved?.(res.data)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save blog'
      setError(msg)
      toast.error(`Failed to save blog: ${msg}`)
    } finally {
      submissionLockRef.current = false
      setSubmitting(false)
      setUploadingMedia(false)
    }
  }

  const handleCancel = () => {
    if (!submitting) onCancel?.()
  }

  const wordCount = form.content ? form.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length : 0
  const readingTime = getReadingTime(form.content || '')
  const selectedImageCount = Number(Boolean(imageFile)) + contentFiles.filter(({ file }) => !isContentVideo(file)).length
  const selectedVideoCount = Number(Boolean(videoFile)) + contentFiles.filter(({ file }) => isContentVideo(file)).length
  const uploadedImageCount = Number(Boolean(imageFile && imageAsset)) + contentFiles.filter(({ file, asset }) => !isContentVideo(file) && asset).length
  const uploadedVideoCount = Number(Boolean(videoFile && videoAsset)) + contentFiles.filter(({ file, asset }) => isContentVideo(file) && asset).length
  const failedUploadCount = Number(Boolean(imageUploadError)) + Number(Boolean(videoUploadError)) + contentFiles.filter(({ status }) => status === 'failed').length
  const totalSelectedMedia = selectedImageCount + selectedVideoCount
  const totalUploadedMedia = uploadedImageCount + uploadedVideoCount

  return (
    <form className="space-y-6">
      {error && (
        <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5 p-4 text-sm text-[var(--error)] flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {submitting && !uploadingMedia && (
        <div className="rounded-xl border border-border/50 bg-[var(--secondary)]/10 p-4 text-sm font-medium text-[var(--accent)] flex items-center gap-2">
          <RotateCcw size={16} className="animate-spin" />
          Publishing blog…
        </div>
      )}

      {totalSelectedMedia > 0 && (
        <div className="space-y-3 rounded-xl border border-border/50 bg-[var(--secondary)]/10 p-4">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs font-medium text-[var(--primary)]/70">
            <span>{uploadingMedia ? 'Uploading media' : 'Media uploaded'}: {totalUploadedMedia}/{totalSelectedMedia}</span>
            <span>Remaining: {totalSelectedMedia - totalUploadedMedia}</span>
            <span>Images uploaded: {uploadedImageCount}/{selectedImageCount}</span>
            <span>Videos uploaded: {uploadedVideoCount}/{selectedVideoCount}</span>
            <span>Failed uploads: {failedUploadCount}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]/30">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
              style={{ width: `${totalSelectedMedia ? (totalUploadedMedia / totalSelectedMedia) * 100 : 0}%` }}
            />
          </div>

          {(imageUploadError || (imageFile && !imageAsset && imageUploadStage)) && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-[var(--primary)]/70">
                {imageUploadStage && <span className="text-[var(--accent)]">●</span>}
                <span>Featured image: </span>
                {imageUploadError ? (
                  <span className="text-[var(--error)]">{imageUploadError}</span>
                ) : imageUploadStage ? (
                  <span>{imageUploadStage}{imageUploadProgress > 0 ? ` ${imageUploadProgress}%` : ''}</span>
                ) : (
                  <span>Pending</span>
                )}
              </span>
              {(imageFile && !imageAsset) ? (
                <button
                  type="button"
                  onClick={retryFeaturedImageUpload}
                  disabled={uploadingMedia}
                  className="font-semibold text-[var(--accent)] disabled:opacity-50 flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
              ) : null}
            </div>
          )}

          {(videoUploadError || (videoFile && !videoAsset && videoUploadStage)) && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-[var(--primary)]/70">
                {videoUploadStage && <span className="text-[var(--accent)]">●</span>}
                <span>Featured video: </span>
                {videoUploadError ? (
                  <span className="text-[var(--error)]">{videoUploadError}</span>
                ) : videoUploadStage ? (
                  <span>{videoUploadStage}{videoUploadProgress > 0 ? ` ${videoUploadProgress}%` : ''}</span>
                ) : (
                  <span>Pending</span>
                )}
              </span>
              {(videoFile && !videoAsset) ? (
                <button
                  type="button"
                  onClick={retryFeaturedVideoUpload}
                  disabled={uploadingMedia}
                  className="font-semibold text-[var(--accent)] disabled:opacity-50 flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
              ) : null}
            </div>
          )}

          {contentFiles.filter(({ status }) => status === 'failed').map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate flex items-center gap-2">
                {item.retryable && <span className="text-[var(--accent)]">↻</span>}
                <span className="text-[var(--error)]">{item.file.name}: {item.error}</span>
              </span>
              <button
                type="button"
                onClick={() => retryContentUpload(item.id)}
                disabled={uploadingMedia}
                className="shrink-0 font-semibold text-[var(--accent)] disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCcw size={12} />
                Retry
              </button>
            </div>
          ))}

          {contentFiles.filter(({ status }) => ['uploading', 'Validating file', 'Compressing image', 'Validating video', 'Authenticating', 'Uploading to media storage', 'Processing media', 'Saving media reference'].includes(status)).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs text-[var(--primary)]/70">
              <span className="min-w-0 truncate flex items-center gap-2">
                <span className="text-[var(--accent)] animate-pulse">●</span>
                <span>{item.file.name}: {item.status}{item.progress > 0 ? ` ${item.progress}%` : ''}</span>
              </span>
              <button
                type="button"
                onClick={() => cancelContentUpload(item.id)}
                className="shrink-0 font-semibold text-[var(--error)]"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="input-luxury"
            placeholder="Enter blog title"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Subtitle
          </label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            className="input-luxury"
            placeholder="Optional subtitle"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Slug
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => handleFieldChange('slug', e.target.value)}
            className="input-luxury"
            placeholder="auto-generated from title"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Category
          </label>
          <input
            type="text"
            list="blog-categories"
            value={form.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            className="input-luxury"
            placeholder="Select or enter category"
          />
          <datalist id="blog-categories">
            {PREDEFINED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Author
          </label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => handleFieldChange('author', e.target.value)}
            className="input-luxury"
            placeholder="Author name"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
          Content
          {wordCount > 0 && (
            <span className="ml-2 text-[var(--primary)]/40">
              ({wordCount} words, ~{readingTime} min read)
            </span>
          )}
        </label>
        <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-border/50 bg-white p-2">
          {FORMAT_COMMANDS.map((cmd) => (
            <button
              key={cmd.tag}
              type="button"
              onClick={() => applyFormat(cmd.tag)}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
              title={cmd.title}
            >
              {cmd.label}
            </button>
          ))}
        </div>
        <textarea
          id="blog-content-editor"
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          className="input-luxury min-h-[200px] resize-y font-mono text-sm"
          placeholder="Write your article content here. Use HTML tags like <h2>, <strong>, <ul><li>, <a href='...'>"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Featured Image
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-32 w-48 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => handleRemovePreview('image')}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <label className="upload-zone flex cursor-pointer flex-col items-center justify-center py-8">
              <UploadCloud size={24} className="text-[var(--primary)]/30" />
              <span className="mt-2 text-sm font-medium text-[var(--primary)]/60">Click to upload featured image</span>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'image')}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Video
          </label>
          {videoPreview ? (
            <div className="relative inline-block">
              {videoPreviewError ? (
                <div className="flex h-32 w-48 flex-col items-center justify-center rounded-xl bg-[var(--secondary)]/20 px-3 text-center">
                  <Video size={22} className="mb-2 text-[var(--primary)]/40" />
                  <span className="text-xs font-medium text-[var(--primary)]/60">Preview unavailable</span>
                </div>
              ) : (
                <video
                  src={videoPreview}
                  className="h-32 w-48 rounded-xl object-cover"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  onError={() => setVideoPreviewError(true)}
                  onCanPlay={() => setVideoPreviewError(false)}
                />
              )}
              <button
                type="button"
                onClick={() => handleRemovePreview('video')}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
              >
                <Trash2 size={12} />
              </button>
              {videoPreviewError && (
                <p className="mt-2 max-w-64 text-xs text-[var(--primary)]/50">
                  The file remains selected. Video compatibility is checked when you save.
                </p>
              )}
            </div>
          ) : (
            <label className="upload-zone flex cursor-pointer flex-col items-center justify-center py-8">
              <Video size={24} className="text-[var(--primary)]/30" />
              <span className="mt-2 text-sm font-medium text-[var(--primary)]/60">Click to upload video</span>
              <input
                type="file"
                ref={videoRef}
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'video')}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
          Content Media (Gallery)
        </label>
        <p className="mb-3 text-xs text-[var(--primary)]/50">
        Additional images and videos to display within the article. Files upload separately and can be retried individually.
        </p>

        {existingContentImages.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {existingContentImages.map((url) => (
              <div key={url} className="relative inline-block">
              {isVideoUrl(url)
                ? <video src={url} aria-label="Existing content video" className="h-20 w-20 rounded-lg object-cover" controls preload="metadata" />
                : <img src={url} alt="Content" className="h-20 w-20 rounded-lg object-cover" loading="lazy" />}
                <button
                  type="button"
                  onClick={() => handleRemoveExistingContentImage(url)}
                  className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {contentFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {contentFiles.map((item, i) => (
              <div key={item.id} className="relative inline-block">
                {isContentVideo(item.file)
                  ? <video src={item.preview} aria-label={`Content video ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" controls muted preload="metadata" />
                  : <img src={item.preview} alt={`Content image ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" loading="lazy" />}
                <button
                  type="button"
                  onClick={() => handleRemoveContentImage(i)}
                  className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="upload-zone flex cursor-pointer flex-col items-center justify-center py-6">
          <UploadCloud size={20} className="text-[var(--primary)]/30" />
          <span className="mt-2 text-sm font-medium text-[var(--primary)]/60">Click to upload gallery media</span>
          <p className="mt-1 text-xs text-[var(--primary)]/40 text-center max-w-xs">Images and videos supported</p>
          <input
            type="file"
            ref={contentInputRef}
            accept="image/*,video/*"
            multiple
            onChange={handleContentImagesChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleFieldChange('tags', e.target.value)}
            className="input-luxury"
            placeholder="Comma-separated: interior, design, luxury"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Meta Description
          </label>
          <textarea
            value={form.metaDescription}
            onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
            className="input-luxury min-h-[56px] resize-y"
            placeholder="SEO meta description (150-160 characters)"
            rows={2}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-end">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Display Order
          </label>
          <input
            type="number"
            value={form.displayOrder}
            onChange={(e) => handleFieldChange('displayOrder', parseInt(e.target.value, 10) || 0)}
            className="input-luxury"
            min={0}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Publish Date
          </label>
          <input
            type="date"
            value={form.publishDate}
            onChange={(e) => handleFieldChange('publishDate', e.target.value)}
            className="input-luxury"
          />
        </div>

        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--primary)]/70">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => handleFieldChange('featured', e.target.checked)}
              className="h-4 w-4 rounded border-border/50 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--primary)]/70">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => handleFieldChange('published', e.target.checked)}
              className="h-4 w-4 rounded border-border/50 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Published
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-6">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-luxury-secondary"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          className="btn-luxury-secondary"
          disabled={submitting || !form.title.trim()}
        >
          {submitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'publish')}
          className="btn-luxury-primary"
          disabled={submitting || !form.title.trim()}
        >
          {submitting ? 'Publishing...' : (isEdit ? 'Update & Publish' : 'Publish')}
        </button>
      </div>
    </form>
  )
}

export default BlogForm