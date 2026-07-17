import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Edit,
  Trash2,
  Video,
  Plus,
  Package,
  Image,
  ArrowUpDown,
  CheckCircle,
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'
import { uploadFiles } from '../../utils/upload'
import { getOptimizedVideoUrl, getVideoPosterUrl, getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const INITIAL_FORM = {
  title: '',
  description: '',
  category: '',
  tags: '',
  mediaType: 'image',
  beforeTitle: 'Before',
  afterTitle: 'After',
  coverImageIndex: 0,
  status: 'draft',
}

export const VirtualInteriorDashboard = () => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
const [mainMediaFiles, setMainMediaFiles] = useState([])
  const [mainMediaPreviews, setMainMediaPreviews] = useState([])
  const [mainVideoFiles, setMainVideoFiles] = useState([])
  const [mainVideoPreviews, setMainVideoPreviews] = useState([])
  // eslint-disable-next-line no-unused-vars -- used as setter in upload handlers
  const [journeyBeforeImages, setJourneyBeforeImages] = useState([])
  const [journeyBeforePreviews, setJourneyBeforePreviews] = useState([])
  // eslint-disable-next-line no-unused-vars -- used as setter in upload handlers
  const [journeyAfterImages, setJourneyAfterImages] = useState([])
  const [journeyAfterPreviews, setJourneyAfterPreviews] = useState([])
  // eslint-disable-next-line no-unused-vars -- used as setter in upload handlers
  const [journeyBeforeVideos, setJourneyBeforeVideos] = useState([])
  const [journeyBeforeVideoPreviews, setJourneyBeforeVideoPreviews] = useState([])
  // eslint-disable-next-line no-unused-vars -- used as setter in upload handlers
  const [journeyAfterVideos, setJourneyAfterVideos] = useState([])
  const [journeyAfterVideoPreviews, setJourneyAfterVideoPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [activeTab, setActiveTab] = useState('items')
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState(-1)
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const journeyBeforeImageRef = useRef(null)
  const journeyBeforeVideoRef = useRef(null)
  const journeyAfterImageRef = useRef(null)
  const journeyAfterVideoRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/virtual-design')
        const data = Array.isArray(res.data) ? res.data : res.data?.items || []
        setItems(data)
      } catch {
        setItems([])
      }
    }
    load()
  }, [])

  const handleFiles = (files, setter, previewSetter) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    setter(prev => [...prev, ...validFiles].slice(0, 50))
    validFiles.forEach(f => previewSetter(prev => [...prev, URL.createObjectURL(f)]))
  }

  const removeMedia = (index, filesSetter, previewsSetter) => {
    filesSetter(prev => prev.filter((_, i) => i !== index))
    previewsSetter(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const moveMedia = (fromIndex, toIndex, filesSetter, previewsSetter) => {
    filesSetter(prev => {
      const newArr = [...prev]
      const [removed] = newArr.splice(fromIndex, 1)
      newArr.splice(toIndex, 0, removed)
      return newArr
    })
    previewsSetter(prev => {
      const newArr = [...prev]
      const [removed] = newArr.splice(fromIndex, 1)
      newArr.splice(toIndex, 0, removed)
      return newArr
    })
  }

  const startEdit = (item) => {
    setEditingId(item._id || item.id)
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      tags: item.tags?.join(', ') || '',
      mediaType: item.mediaType || 'image',
      beforeTitle: item.beforeTitle || 'Before',
      afterTitle: item.afterTitle || 'After',
      coverImageIndex: item.coverImageIndex || 0,
      status: item.status || 'draft',
    })
    const images = item.images && item.images.length > 0
      ? item.images.map(img => typeof img === 'string' ? img : img.url)
      : (item.imageUrl ? [item.imageUrl] : [])
    setMainMediaPreviews(images)
    setMainMediaFiles(images.map(() => null))
    if (item.journey) {
      setJourneyBeforePreviews(item.journey.before?.images || [])
      setJourneyBeforeImages(item.journey.before?.images?.map(() => null) || [])
      setJourneyAfterPreviews(item.journey.after?.images || [])
      setJourneyAfterImages(item.journey.after?.images?.map(() => null) || [])
      setJourneyBeforeVideoPreviews(item.journey.before?.videos || [])
      setJourneyBeforeVideos(item.journey.before?.videos?.map(() => null) || [])
      setJourneyAfterVideoPreviews(item.journey.after?.videos || [])
      setJourneyAfterVideos(item.journey.after?.videos?.map(() => null) || [])
    }
    setActiveTab('items')
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setMainMediaFiles([])
    setMainMediaPreviews([])
    setMainVideoFiles([])
    setMainVideoPreviews([])
    setJourneyBeforeImages([])
    setJourneyBeforePreviews([])
    setJourneyAfterImages([])
    setJourneyAfterPreviews([])
    setJourneyBeforeVideos([])
    setJourneyBeforeVideoPreviews([])
    setJourneyAfterVideos([])
    setJourneyAfterVideoPreviews([])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
    setDragOverIndex(-1)
  }

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
    e.target.classList.add('opacity-50')
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50')
    setDragOverIndex(-1)
  }

  const handleDragEnter = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e, filesSetter, previewsSetter) => {
    e.preventDefault()
    setIsDragOver(false)
    setDragOverIndex(-1)
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    const toIndex = Array.from(e.target.closest('.grid').children).findIndex(
      el => el === e.target.closest('.relative.rounded-xl')
    )
    if (fromIndex !== toIndex && !isNaN(toIndex)) {
      moveMedia(fromIndex, toIndex, filesSetter, previewsSetter)
    }
  }

const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setUploading(true)
    setUploadProgress({})
    try {
      const imageFiles = mainMediaFiles
      const videoFiles = mainVideoFiles

      if (imageFiles.length > 0 || videoFiles.length > 0) {
        await new Promise((resolve, reject) => {
          uploadFiles({
            files: imageFiles,
            endpoint: '/api/content/virtual-design',
            fieldName: 'images',
            additionalFields: {
              title: form.title,
              description: form.description,
              category: form.category,
              tags: form.tags,
              coverImageIndex: String(form.coverImageIndex || 0),
              status: form.status,
              beforeTitle: form.beforeTitle,
              afterTitle: form.afterTitle,
              ...(editingId ? { id: editingId } : {})
            },
            maxConcurrent: 3,
            maxRetries: 3,
            onFileProgress: (file, progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [file.file.name]: progress
              }))
            },
            onFileError: (file, error) => {
              console.error('Upload error for', file.file.name, error)
            },
            onAllComplete: ({ failed }) => {
              if (failed.length > 0) {
                reject(new Error(`${failed.length} image(s) failed to upload`))
              } else {
                // Now upload videos
                uploadFiles({
                  files: videoFiles,
                  endpoint: '/api/content/virtual-design',
                  fieldName: 'videos',
                  additionalFields: {
                    title: form.title,
                    description: form.description,
                    category: form.category,
                    tags: form.tags,
                    coverImageIndex: String(form.coverImageIndex || 0),
                    status: form.status,
                    beforeTitle: form.beforeTitle,
                    afterTitle: form.afterTitle,
                    ...(editingId ? { id: editingId } : {})
                  },
                  maxConcurrent: 3,
                  maxRetries: 3,
                  onFileProgress: (file, progress) => {
                    setUploadProgress(prev => ({
                      ...prev,
                      [file.file.name]: progress
                    }))
                  },
                  onFileError: (file, error) => {
                    console.error('Upload error for', file.file.name, error)
                  },
                  onAllComplete: ({ failed }) => {
                    if (failed.length > 0) {
                      reject(new Error(`${failed.length} video(s) failed to upload`))
                    } else {
                      resolve()
                    }
                  }
                })
              }
            }
          })
        })
      }

      const res = await api.get('/content/virtual-design')
      setItems(Array.isArray(res.data) ? res.data : res.data?.items || [])
      emitAdminDataChanged({ type: 'virtual-changed' })
      resetForm()
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
      setUploading(false)
      setUploadProgress({})
    }
  }

const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/content/virtual-design/${deleteId}`)
      setDeleteId(null)
      const res = await api.get('/content/virtual-design')
      setItems(Array.isArray(res.data) ? res.data : res.data?.items || [])
      emitAdminDataChanged({ type: 'virtual-changed' })
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const renderMediaUpload = ({ label, accept, files, previews, onClick, isDragOver, setFiles, setPreviews }) => (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={onClick}
      className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
        isDragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
      }`}
    >
      {previews.length > 0 ? (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--primary)]">{label} ({previews.length}/50)</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onClick}
              className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium"
            >
              Add More
            </motion.button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {previews.map((preview, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDrop={(e) => handleDrop(e, setFiles, setPreviews)}
                draggable
                className={`relative rounded-xl overflow-hidden group ${dragOverIndex === index ? 'ring-2 ring-[var(--accent)]' : ''}`}
              >
                {preview.startsWith('blob:') || preview.startsWith('http') ? (
                  preview.match(/\.(mp4|webm|mov)$/i) || (files[index] && files[index].type.startsWith('video/')) ? (
                    <video src={preview} className="h-40 w-full object-cover" autoPlay muted loop controls />
                  ) : (
                    <img src={preview} alt={`${label} ${index + 1}`} className="h-40 w-full object-cover" />
                  )
                ) : (
                  <div className="h-40 w-full bg-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                    <Video size={28} />
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeMedia(index, setFiles, setPreviews) }}
                  className="absolute top-2 right-2 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </motion.button>
                <div className="absolute bottom-2 left-2 text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
                {index === form.coverImageIndex && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute top-2 left-2 bg-[var(--accent)] text-white px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-widest"
                  >
                    Cover
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, coverImageIndex: index })) }}
                  className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-[var(--primary)] p-2 rounded-full hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Set as cover"
                >
                  <CheckCircle size={14} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/10 flex items-center justify-center text-[var(--accent)]"
          >
            {accept === 'video/*' ? <Video size={28} /> : <Image size={28} />}
          </motion.div>
          <div>
            <p className="text-sm font-medium text-[var(--primary)]">Drop {accept === 'video/*' ? 'video' : 'images'} here or click to browse</p>
            <p className="text-[10px] text-[var(--primary)]/50 mt-1">{accept === 'video/*' ? 'MP4, MOV up to 100MB' : 'PNG, JPG up to 10MB each (max 50)'}</p>
          </div>
        </div>
      )}
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Virtual Interior Design</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">Manage virtual design projects, media, and project journeys</p>
        </div>
        
        <div className="flex gap-2 border-b border-[var(--border)]">
          {[
            { id: 'items', label: 'Projects', icon: Package },
            { id: 'journey', label: 'Project Journey', icon: ArrowUpDown },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab(tab.id); resetForm() }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[var(--primary)] text-white shadow-lg'
                    : 'text-[var(--primary)]/60 hover:text-[var(--accent)] hover:bg-[var(--bg)]/50'
                }`}
              >
                <Icon size={16} strokeWidth={1.5} />
                {tab.label}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Items Tab - Regular Projects */}
      {activeTab === 'items' && (
        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={submit}
            className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5 self-start"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-[var(--primary)]">
                  {editingId ? 'Edit' : 'Add'} Virtual Design Project
                </h3>
                <p className="text-[10px] text-[var(--primary)]/50 mt-1">
                  {editingId ? 'Update project details' : 'Create a new virtual design project'}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetForm}
                className="p-2 rounded-xl text-[var(--primary)]/50 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)] transition"
              >
                <X size={20} strokeWidth={1.5} />
              </motion.button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="Project Title"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                placeholder="Describe this virtual design project..."
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="Residential"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Tags</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="modern, luxury"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Cover Image Index</label>
                <select
                  value={form.coverImageIndex}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageIndex: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                >
                  {Array.from({ length: 50 }, (_, i) => i).map(i => (
                    <option key={i} value={i}>Image {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Before Label</label>
                <input
                  value={form.beforeTitle}
                  onChange={(e) => setForm((f) => ({ ...f, beforeTitle: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="Before"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">After Label</label>
                <input
                  value={form.afterTitle}
                  onChange={(e) => setForm((f) => ({ ...f, afterTitle: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="After"
                />
              </div>
            </div>

            {/* Main Media Upload - Multiple Images */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
                <Image size={14} strokeWidth={1.5} />
                Project Images (Drag to reorder, click cover badge to set cover)
              </label>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files, setMainMediaFiles, setMainMediaPreviews)} className="hidden" />
              {renderMediaUpload({
                label: 'Project Images',
                accept: 'image/*',
                files: mainMediaFiles,
                previews: mainMediaPreviews,
                onClick: () => fileRef.current?.click(),
                fileRef,
                isDragOver: isDragOver,
                setFiles: setMainMediaFiles,
                setPreviews: setMainMediaPreviews,
              })}
            </div>

            {/* Main Media Upload - Multiple Videos */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
                <Video size={14} strokeWidth={1.5} />
                Project Videos (Drag to reorder)
              </label>
              <input ref={videoRef} type="file" accept="video/*" multiple onChange={(e) => handleFiles(e.target.files, setMainVideoFiles, setMainVideoPreviews)} className="hidden" />
              {renderMediaUpload({
                label: 'Project Videos',
                accept: 'video/*',
                files: mainVideoFiles,
                previews: mainVideoPreviews,
                onClick: () => videoRef.current?.click(),
                fileRef: videoRef,
                isDragOver: isDragOver,
                setFiles: setMainVideoFiles,
                setPreviews: setMainVideoPreviews,
              })}
            </div>

            <div className="flex gap-3 pt-2">
              {uploading && Object.keys(uploadProgress).length > 0 && (
                <div className="w-full bg-[var(--secondary)]/50 rounded-xl p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 mb-2">Uploading Files</div>
                  <div className="space-y-1">
                    {Object.entries(uploadProgress).map(([name, progress]) => (
                      <div key={name} className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percentage}%` }}
                            className="h-full bg-[var(--accent)] rounded-full"
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--primary)]/60 w-10 text-right">{progress.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg"
                disabled={loading || uploading}
              >
                {uploading ? 'Uploading…' : loading ? 'Saving…' : editingId ? 'Update Project' : 'Upload Project'}
              </motion.button>
            </div>
          </motion.form>

          <div className="grid gap-5 sm:grid-cols-2">
            {items.map((item, i) => (
              <motion.div
                layout
                key={item._id || item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden group"
              >
                <div className="relative">
                  {item.videoUrl ? (
                    <video
                      src={getOptimizedVideoUrl(item.videoUrl, { width: 480 })}
                      poster={getVideoPosterUrl(item.videoUrl, { width: 480 })}
                      className="h-44 w-full object-cover"
                      autoPlay
                      muted
                      loop
                    />
                  ) : item.images && item.images.length > 0 ? (
                    <img
                      src={getOptimizedUrl(
                        typeof item.images[item.coverImageIndex || 0] === 'string' 
                          ? item.images[item.coverImageIndex || 0] 
                          : item.images[item.coverImageIndex || 0]?.url,
                        { width: 480 }
                      )}
                      alt={item.title}
                      className="h-44 w-full object-cover"
                    />
                  ) : item.imageUrl ? (
                    <img
                      src={getOptimizedUrl(item.imageUrl, { width: 480 })}
                      alt={item.title}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="h-44 w-full bg-[var(--secondary)]/60 flex items-center justify-center text-[var(--primary)]/30">
                      <Video size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[var(--primary)]/0 transition-all duration-300 group-hover:bg-[var(--primary)]/30" />
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => startEdit(item)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg"
                    >
                      <Edit size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDeleteId(item._id || item.id)}
                      className="p-2 bg-[var(--error)]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[var(--error)] shadow-lg"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                  {item.images && item.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 bg-black/50 text-white text-[10px] px-2 py-1 rounded">
                      {item.images.length} images
                    </div>
                  )}
                  {item.status && (
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-medium uppercase ${
                      item.status === 'published' ? 'bg-green-500/90 text-white' :
                      item.status === 'draft' ? 'bg-yellow-500/90 text-white' :
                      'bg-gray-500/90 text-white'
                    }`}>
                      {item.status}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg text-[var(--primary)]">{item.title}</h3>
                  <p className="text-xs text-[var(--primary)]/50 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(item.tags || []).slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
            {items.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
                  <Video size={32} />
                </div>
                <p className="font-display text-xl text-[var(--primary)]/30">No projects yet</p>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Project Journey Tab */}
      {activeTab === 'journey' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h2 className="font-display text-3xl text-[var(--primary)]">Project Journey</h2>
              <p className="text-sm text-[var(--primary)]/50 mt-1">Showcase before/after transformations</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEditingId('new'); resetForm(); setActiveTab('journey') }}
              className="btn-luxury-primary flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={2} />
              Add Journey
            </motion.button>
          </motion.div>

          {/* Journey Form */}
          {editingId && (
            <motion.form
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={submit}
              className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5 mb-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-[var(--primary)]">
                    {editingId === 'new' ? 'Create' : 'Edit'} Project Journey
                  </h3>
                  <p className="text-[10px] text-[var(--primary)]/50 mt-1">
                    Showcase transformation with before/after media
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={resetForm}
                  className="p-2 rounded-xl text-[var(--primary)]/50 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)] transition"
                >
                  <X size={20} strokeWidth={1.5} />
                </motion.button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Project Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="Project Title (e.g., Villa Renovation)"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                  placeholder="Describe the transformation..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Before Label</label>
                  <input
                    value={form.beforeTitle}
                    onChange={(e) => setForm((f) => ({ ...f, beforeTitle: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="Before"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">After Label</label>
                  <input
                    value={form.afterTitle}
                    onChange={(e) => setForm((f) => ({ ...f, afterTitle: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="After"
                  />
                </div>
              </div>

              {/* Before Section */}
              <div className="border-t border-[var(--border)] pt-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-[var(--accent)]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">BEFORE - {form.beforeTitle || 'Before'}</p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Images</label>
                  <input ref={journeyBeforeImageRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files, setJourneyBeforeImages, setJourneyBeforePreviews)} className="hidden" />
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => journeyBeforeImageRef.current?.click()}
                    className="relative border-2 border-dashed rounded-2xl transition-all duration-300 border-[var(--border)] bg-[var(--bg)]/30"
                  >
                    {journeyBeforePreviews.length > 0 ? (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-[var(--primary)]">Before Images ({journeyBeforePreviews.length})</p>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => journeyBeforeImageRef.current?.click()} className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium">Add More</motion.button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {journeyBeforePreviews.map((preview, index) => (
                            <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-xl overflow-hidden group">
                              <img src={preview} alt={`Before ${index + 1}`} className="h-32 w-full object-cover" />
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={(e) => { e.stopPropagation(); setJourneyBeforeImages(p => p.filter((_, i) => i !== index)); setJourneyBeforePreviews(p => { URL.revokeObjectURL(p[index]); return p.filter((_, i) => i !== index) }) }} className="absolute top-1 right-1 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></motion.button>
                              <div className="absolute bottom-1 left-1 text-[9px] font-medium text-white bg-black/50 px-1 py-0.5 rounded">{index + 1}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <Image size={28} className="text-[var(--accent)]" />
                        <div><p className="text-sm font-medium text-[var(--primary)]">Drop before images here or click to browse</p><p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG up to 10MB each</p></div>
                      </div>
                    )}
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Videos</label>
                  <input ref={journeyBeforeVideoRef} type="file" accept="video/*" multiple onChange={(e) => handleFiles(e.target.files, setJourneyBeforeVideos, setJourneyBeforeVideoPreviews)} className="hidden" />
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => journeyBeforeVideoRef.current?.click()}
                    className="relative border-2 border-dashed rounded-2xl transition-all duration-300 border-[var(--border)] bg-[var(--bg)]/30"
                  >
                    {journeyBeforeVideoPreviews.length > 0 ? (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-[var(--primary)]">Before Videos ({journeyBeforeVideoPreviews.length})</p>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => journeyBeforeVideoRef.current?.click()} className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium">Add More</motion.button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {journeyBeforeVideoPreviews.map((preview, index) => (
                            <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-xl overflow-hidden group">
                              <video src={preview} className="h-32 w-full object-cover" autoPlay muted loop controls />
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={(e) => { e.stopPropagation(); setJourneyBeforeVideos(p => p.filter((_, i) => i !== index)); setJourneyBeforeVideoPreviews(p => { URL.revokeObjectURL(p[index]); return p.filter((_, i) => i !== index) }) }} className="absolute top-1 right-1 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <Video size={28} className="text-[var(--accent)]" />
                        <div><p className="text-sm font-medium text-[var(--primary)]">Drop before videos here or click to browse</p><p className="text-[10px] text-[var(--primary)]/50 mt-1">MP4, MOV up to 100MB each</p></div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* After Section */}
              <div className="border-t border-[var(--border)] pt-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-[var(--accent)]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">AFTER - {form.afterTitle || 'After'}</p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Images</label>
                  <input ref={journeyAfterImageRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files, setJourneyAfterImages, setJourneyAfterPreviews)} className="hidden" />
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => journeyAfterImageRef.current?.click()}
                    className="relative border-2 border-dashed rounded-2xl transition-all duration-300 border-[var(--border)] bg-[var(--bg)]/30"
                  >
                    {journeyAfterPreviews.length > 0 ? (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-[var(--primary)]">After Images ({journeyAfterPreviews.length})</p>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => journeyAfterImageRef.current?.click()} className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium">Add More</motion.button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {journeyAfterPreviews.map((preview, index) => (
                            <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-xl overflow-hidden group">
                              <img src={preview} alt={`After ${index + 1}`} className="h-32 w-full object-cover" />
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={(e) => { e.stopPropagation(); setJourneyAfterImages(p => p.filter((_, i) => i !== index)); setJourneyAfterPreviews(p => { URL.revokeObjectURL(p[index]); return p.filter((_, i) => i !== index) }) }} className="absolute top-1 right-1 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></motion.button>
                              <div className="absolute bottom-1 left-1 text-[9px] font-medium text-white bg-black/50 px-1 py-0.5 rounded">{index + 1}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <Image size={28} className="text-[var(--accent)]" />
                        <div><p className="text-sm font-medium text-[var(--primary)]">Drop after images here or click to browse</p><p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG up to 10MB each</p></div>
                      </div>
                    )}
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Videos</label>
                  <input ref={journeyAfterVideoRef} type="file" accept="video/*" multiple onChange={(e) => handleFiles(e.target.files, setJourneyAfterVideos, setJourneyAfterVideoPreviews)} className="hidden" />
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => journeyAfterVideoRef.current?.click()}
                    className="relative border-2 border-dashed rounded-2xl transition-all duration-300 border-[var(--border)] bg-[var(--bg)]/30"
                  >
                    {journeyAfterVideoPreviews.length > 0 ? (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-[var(--primary)]">After Videos ({journeyAfterVideoPreviews.length})</p>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => journeyAfterVideoRef.current?.click()} className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium">Add More</motion.button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {journeyAfterVideoPreviews.map((preview, index) => (
                            <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-xl overflow-hidden group">
                              <video src={preview} className="h-32 w-full object-cover" autoPlay muted loop controls />
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={(e) => { e.stopPropagation(); setJourneyAfterVideos(p => p.filter((_, i) => i !== index)); setJourneyAfterVideoPreviews(p => { URL.revokeObjectURL(p[index]); return p.filter((_, i) => i !== index) }) }} className="absolute top-1 right-1 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <Video size={28} className="text-[var(--accent)]" />
                        <div><p className="text-sm font-medium text-[var(--primary)]">Drop after videos here or click to browse</p><p className="text-[10px] text-[var(--primary)]/50 mt-1">MP4, MOV up to 100MB each</p></div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Saving…' : editingId === 'new' ? 'Create Journey' : 'Update Journey'}
                </motion.button>
              </div>
            </motion.form>
          )}

          {/* Journey Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.filter(item => item.journey).map((item, i) => (
              <motion.div
                layout
                key={item._id || item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(42,36,31,0.06)] group"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {item.journey?.after?.images?.[0] ? (
                    <img src={getOptimizedUrl(item.journey.after.images[0], { width: 480 })} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                  ) : item.journey?.before?.images?.[0] ? (
                    <img src={getOptimizedUrl(item.journey.before.images[0], { width: 480 })} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                      <Image size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setEditingId(item._id); setActiveTab('journey'); startEdit(item) }} className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg"><Edit size={14} /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setDeleteId(item._id || item.id)} className="p-2 bg-[var(--error)]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[var(--error)] shadow-lg"><Trash2 size={14} /></motion.button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg text-[var(--primary)]">{item.title}</h3>
                  <p className="text-xs text-[var(--primary)]/50 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium">{item.journey?.beforeTitle || 'Before'}</span>
                    <ArrowUpDown size={10} className="text-[var(--accent)]" />
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium">{item.journey?.afterTitle || 'After'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {items.filter(item => item.journey).length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
                  <ArrowUpDown size={32} />
                </div>
                <p className="font-display text-xl text-[var(--primary)]/30">No project journeys yet</p>
                <p className="text-sm text-[var(--primary)]/40 mt-2">Click "Add Journey" to create your first transformation showcase</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Confirm Delete</h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">Are you sure? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deleteItem}
                  className="rounded-full bg-[var(--error)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--error)] hover:shadow-lg"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}