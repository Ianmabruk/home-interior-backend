import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, X, Edit, Trash2, Images, Eye, Plus, Star, Image, Loader2 } from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'General',
  featured: false,
  displayOrder: 0
}

export const PortfolioDashboard = () => {
  const [portfolio, setPortfolio] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [mainImageFile, setMainImageFile] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [isDragOverMain, setIsDragOverMain] = useState(false)
  const [isDragOverGallery, setIsDragOverGallery] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [optimisticUpdates, setOptimisticUpdates] = useState(new Set())
  const mainFileRef = useRef(null)
  const galleryFileRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/portfolio')
      const data = Array.isArray(res.data) ? res.data : res.data?.items || []
      setPortfolio(data)
    } catch {
      setPortfolio([])
    }
   }, [])

  // Initial data load on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() populates initial state from API
  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = () => { load() }
    window.addEventListener('admin:data-changed', handler)
    return () => window.removeEventListener('admin:data-changed', handler)
  }, [load])

  const handleMainFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (validFiles.length > 0) {
      setMainImageFile(validFiles[0])
      setMainImagePreview(URL.createObjectURL(validFiles[0]))
    }
  }

  const handleGalleryFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    const newFiles = [...galleryFiles, ...validFiles].slice(0, 10)
    setGalleryFiles(newFiles)
    validFiles.forEach(f => setGalleryPreviews(prev => [...prev, URL.createObjectURL(f)]))
  }

  const handleMainDrop = (e) => {
    e.preventDefault()
    setIsDragOverMain(false)
    handleMainFiles(e.dataTransfer.files)
  }

  const handleGalleryDrop = (e) => {
    e.preventDefault()
    setIsDragOverGallery(false)
    handleGalleryFiles(e.dataTransfer.files)
  }

  const handleMainDragOver = (e) => {
    e.preventDefault()
    setIsDragOverMain(true)
  }

  const handleGalleryDragOver = (e) => {
    e.preventDefault()
    setIsDragOverGallery(true)
  }

  const handleMainDragLeave = () => setIsDragOverMain(false)
  const handleGalleryDragLeave = () => setIsDragOverGallery(false)

  const removeMainImage = () => {
    setMainImageFile(null)
    setMainImagePreview(null)
    if (mainFileRef.current) mainFileRef.current.value = ''
  }

  const removeGalleryImage = (index) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index))
    setGalleryPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || 'General',
      featured: item.featured || false,
      displayOrder: item.displayOrder || 0,
    })
    setMainImageFile(item.imageUrl ? { url: item.imageUrl } : null)
    setMainImagePreview(item.imageUrl ? item.imageUrl : null)
    setGalleryFiles(item.galleryImages ? [{ url: item.galleryImages[0] }] : [])
    setGalleryPreviews(item.galleryImages ? item.galleryImages : [])
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setMainImageFile(null)
    setMainImagePreview(null)
    setGalleryFiles([])
    setGalleryPreviews([])
    setShowForm(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title)
      if (form.description) payload.append('description', form.description)
      if (form.category) payload.append('category', form.category)
      payload.append('featured', String(form.featured))
      payload.append('displayOrder', String(form.displayOrder || 0))

      if (mainImageFile && mainImageFile instanceof File) {
        payload.append('media', mainImageFile)
      }

      if (galleryFiles.length > 0) {
        galleryFiles.forEach((file) => {
          if (file instanceof File) {
            payload.append('gallery', file)
          }
        })
      }

      if (editingId) {
        await api.patch(`/portfolio/${editingId}`, payload)
      } else {
        await api.post('/portfolio', payload)
      }
      resetForm()
      load()
      emitAdminDataChanged({ type: 'portfolio-changed' })
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async () => {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)

    // Optimistic update
    setPortfolio(prev => prev.filter(item => item.id !== id))
    setOptimisticUpdates(prev => new Set(prev).add(id))

    try {
      await api.delete(`/portfolio/${id}`)
      setOptimisticUpdates(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      load()
      emitAdminDataChanged({ type: 'portfolio-changed' })
    } catch (err) {
      console.error('Delete error:', err)
      // Rollback on error
      setOptimisticUpdates(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      load()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Portfolio</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{portfolio.length} projects</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setMainImageFile(null); setMainImagePreview(null); setGalleryFiles([]); setGalleryPreviews([]); setShowForm(true) }}
          className="btn-luxury-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2} />
          Add Portfolio Project
        </motion.button>
      </motion.div>

      {/* Upload Form - Slides down when adding/editing */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={submit}
            className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-[var(--primary)]">
                  {editingId ? 'Edit' : 'Add'} Portfolio Project
                </h3>
                <p className="text-[10px] text-[var(--primary)]/50 mt-1">
                  {editingId ? 'Update project details' : 'Create a new portfolio project'}
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
                placeholder="Project title"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                placeholder="Describe this portfolio piece..."
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="e.g. Residential, Commercial"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
                <input
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
                  type="number"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Featured in Hero</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                  />
                  <span className="text-sm text-[var(--primary)]">Show this project in the homepage hero carousel</span>
                </label>
              </div>
            </div>

            {/* Main Image Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
                <Image size={14} strokeWidth={1.5} />
                Main Project Image
              </label>
              <input ref={mainFileRef} type="file" accept="image/*" onChange={(e) => handleMainFiles(e.target.files)} className="hidden" />
              <motion.div
                whileHover={{ scale: 1.01 }}
                onDrop={handleMainDrop}
                onDragOver={handleMainDragOver}
                onDragLeave={handleMainDragLeave}
                onClick={() => mainFileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  isDragOverMain ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
                }`}
              >
                {mainImagePreview ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--primary)]">Main Image (1 max)</p>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => mainFileRef.current?.click()}
                        className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium"
                      >
                        Replace
                      </motion.button>
                    </div>
                    <div className="relative rounded-xl overflow-hidden group">
                      <img
                        src={mainImagePreview}
                        alt="Preview"
                        className="h-40 w-full object-cover"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeMainImage() }}
                        className="absolute top-2 right-2 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/10 flex items-center justify-center text-[var(--accent)]"
                    >
                      <UploadCloud size={28} />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-[var(--primary)]">Drop image here or click to browse</p>
                      <p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Gallery Images Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
                <Images size={14} strokeWidth={1.5} />
                Gallery Images (up to 10)
              </label>
              <input ref={galleryFileRef} type="file" accept="image/*" multiple onChange={(e) => handleGalleryFiles(e.target.files)} className="hidden" />
              <motion.div
                whileHover={{ scale: 1.01 }}
                onDrop={handleGalleryDrop}
                onDragOver={handleGalleryDragOver}
                onDragLeave={handleGalleryDragLeave}
                onClick={() => galleryFileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  isDragOverGallery ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
                }`}
              >
                {galleryPreviews.length > 0 ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--primary)]">Gallery Images ({galleryPreviews.length}/10)</p>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => galleryFileRef.current?.click()}
                        className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium"
                      >
                        Add More
                      </motion.button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {galleryPreviews.map((src, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden group">
                          <img
                            src={src}
                            alt="Gallery preview"
                            className="h-28 w-full object-cover"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeGalleryImage(i) }}
                            className="absolute top-1 right-1 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </motion.button>
                        </div>
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
                      <UploadCloud size={28} />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-[var(--primary)]">Drop images here or click to browse</p>
                      <p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG up to 10MB each (max 10)</p>
                    </div>
                  </div>
                )}
              </motion.div>
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
                className="flex-1 rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
                type="submit"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Saving...' : editingId ? 'Update Project' : 'Upload Project'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Portfolio Gallery - Clean Luxury Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {portfolio.map((item, i) => {
          const isOptimistic = optimisticUpdates.has(item.id)
          return (
            <motion.article
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isOptimistic ? 0.5 : 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                    <Images size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/85 via-[var(--primary)]/40 to-transparent opacity-100" />

                {/* Featured Badge - Top Left */}
                {item.featured && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 left-3 z-10"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
                      <Star size={10} strokeWidth={2} />
                      Featured
                    </span>
                  </motion.div>
                )}

                {/* Gallery Count Badge - Top Right */}
                {item.galleryImages && item.galleryImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 right-3 z-10"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
                      <Images size={10} strokeWidth={2} />
                      {item.galleryImages.length} photos
                    </span>
                  </motion.div>
                )}

                {/* View Project Button - Bottom Center */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = `/portfolio/${item.id}`}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 btn-luxury-primary group flex items-center gap-2 text-[10px] px-5 py-2.5 rounded-full opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                >
                  View Project
                  <Eye size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
                </motion.button>

                {/* Quick Actions - Top Right */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg"
                    aria-label="Edit project"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteId(item.id)}
                    className="p-2 bg-[var(--error)]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[var(--error)] shadow-lg"
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>

              {/* Info Card at Bottom */}
              <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="font-display text-xl md:text-2xl font-normal text-[var(--primary)] leading-tight"
                >
                  {item.title}
                </motion.h3>
                {(item.galleryImages && item.galleryImages.length > 0) && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="mt-2 text-sm leading-relaxed text-[var(--primary)]/60"
                  >
                    {item.galleryImages.length} gallery image{item.galleryImages.length > 1 ? 's' : ''}
                  </motion.p>
                )}
              </div>
            </motion.article>
          )
        })}

        {portfolio.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
              <Images size={32} />
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30">No portfolio projects yet</p>
            <p className="text-sm text-[var(--primary)]/40 mt-2">Click "Add Portfolio Project" to get started</p>
          </motion.div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
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
