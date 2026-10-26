import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from '@components/common/DynamicMotion'
import {
  X,
  Edit,
  Trash2,
  Video,
  Plus,
  Image,
  Star,
  Images,
  Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { getOptimizedVideoUrl, getVideoPosterUrl, getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'General',
  mediaType: 'image',
  featured: false,
  price: '',
  priceMax: '',
  currency: 'KES',
  priceSuffix: '',
  tagline: '',
  ctaText: 'Book',
  packageType: '',
  features: [],
}

export const VirtualDesignDashboard = () => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [mainMediaFiles, setMainMediaFiles] = useState([])
  const [mainMediaPreviews, setMainMediaPreviews] = useState([])
  const [galleryFiles, setGalleryFiles] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [addOnsLoading, setAddOnsLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [isDragOverMain, setIsDragOverMain] = useState(false)
  const [isDragOverGallery, setIsDragOverGallery] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [optimisticDeletes, setOptimisticDeletes] = useState(new Set())
  const [featureInput, setFeatureInput] = useState('')
  const [addOnServices, setAddOnServices] = useState([])
  const [editingAddOnId, setEditingAddOnId] = useState(null)
  const [addOnForm, setAddOnForm] = useState({ name: '', price: '', currency: 'KES', durationMinutes: '', description: '', isActive: true, displayOrder: '0' })
  const mainFileRef = useRef(null)
  const videoRef = useRef(null)
  const galleryFileRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/virtual-designs')
      const data = Array.isArray(res.data) ? res.data : res.data?.items || []
      setItems(data)
    } catch {
      setItems([])
    }
   }, [])

  const loadAddOns = useCallback(async () => {
    setAddOnsLoading(true)
    try {
      const res = await api.get('/admin/virtual-designs/add-ons')
      const data = Array.isArray(res.data) ? res.data : res.data?.items || []
      setAddOnServices(data)
    } catch {
      setAddOnServices([])
    } finally {
      setAddOnsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = () => { load() }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [load])

  useEffect(() => {
    const handler = () => { loadAddOns() }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [loadAddOns])

  useEffect(() => {
    loadAddOns()
  }, [loadAddOns])

  const handleMainFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (validFiles.length > 0) {
      setMainMediaFiles([validFiles[0]])
      setMainMediaPreviews([URL.createObjectURL(validFiles[0])])
    }
  }, [])

  const handleGalleryFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    const newFiles = [...galleryFiles, ...validFiles].slice(0, 10)
    setGalleryFiles(newFiles)
    validFiles.forEach(f => setGalleryPreviews(prev => [...prev, URL.createObjectURL(f)]))
  }, [galleryFiles])

  const removeMainMedia = useCallback((index) => {
    setMainMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMainMediaPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const removeGalleryMedia = useCallback((index) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index))
    setGalleryPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const startEdit = useCallback((item) => {
    setEditingId(item._id || item.id)
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || 'General',
      mediaType: item.mediaType || 'image',
      featured: item.featured || false,
      price: item.price || '',
      priceMax: item.priceMax || '',
      currency: item.currency || 'KES',
      priceSuffix: item.priceSuffix || '',
      tagline: item.tagline || '',
      ctaText: item.ctaText || 'Book',
      packageType: item.packageType || '',
      features: item.features || [],
    })
    setMainMediaFiles(item.mediaUrl ? [{ url: item.mediaUrl, type: item.mediaType }] : [])
    setMainMediaPreviews(item.mediaUrl ? [item.mediaUrl] : [])
    setGalleryFiles(item.galleryMedia ? item.galleryMedia.map(m => ({ url: m.url, type: m.type })) : [])
    setGalleryPreviews(item.galleryMedia ? item.galleryMedia.map(m => m.url) : [])
    setShowForm(true)
    setError('')
    setFeatureInput('')
  }, [])

  const resetForm = useCallback(() => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setMainMediaFiles([])
    setMainMediaPreviews([])
    setGalleryFiles([])
    setGalleryPreviews([])
    setShowForm(false)
    setError('')
    setFeatureInput('')
  }, [])

  const handleMainDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOverMain(true)
  }, [])

  const handleMainDragLeave = useCallback(() => {
    setIsDragOverMain(false)
  }, [])

  const handleGalleryDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOverGallery(true)
  }, [])

  const handleGalleryDragLeave = useCallback(() => {
    setIsDragOverGallery(false)
  }, [])

  const handleMainDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOverMain(false)
    handleMainFiles(e.dataTransfer.files)
  }, [handleMainFiles])

  const handleGalleryDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOverGallery(false)
    handleGalleryFiles(e.dataTransfer.files)
  }, [handleGalleryFiles])

  const addFeature = useCallback(() => {
    const text = featureInput.trim()
    if (!text) return
    setForm((f) => ({ ...f, features: [...f.features, text] }))
    setFeatureInput('')
  }, [featureInput])

  const addAddOn = useCallback(() => {
    setEditingAddOnId(null)
    setAddOnForm({ name: '', price: '', currency: 'KES', durationMinutes: '', description: '', isActive: true, displayOrder: '0' })
  }, [])

  const removeAddOn = useCallback(async (id) => {
    try {
      await api.delete(`/admin/virtual-designs/add-ons/${id}`)
      setAddOnServices(prev => prev.filter(a => a.id !== id))
      dispatchAdminDataChanged('addon-changed')
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete add-on'
      setError(message)
      toast.error(message)
    }
  }, [])

  const removeFeature = useCallback((index) => {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }))
  }, [])

  const moveFeature = useCallback((index, direction) => {
    setForm((f) => {
      const features = [...f.features]
      const target = index + direction
      if (target < 0 || target >= features.length) return f
      ;[features[index], features[target]] = [features[target], features[index]]
      return { ...f, features }
    })
  }, [])

  const submitAddOn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: addOnForm.name,
        description: addOnForm.description || '',
        price: Number(addOnForm.price),
        currency: addOnForm.currency || 'KES',
        durationMinutes: addOnForm.durationMinutes ? Number(addOnForm.durationMinutes) : null,
        isActive: addOnForm.isActive !== 'false' && addOnForm.isActive !== false,
        displayOrder: Number(addOnForm.displayOrder) || 0,
      }
      if (editingAddOnId) {
        await api.patch(`/admin/virtual-designs/add-ons/${editingAddOnId}`, payload)
      } else {
        await api.post('/admin/virtual-designs/add-ons', payload)
      }
      setEditingAddOnId(null)
      setAddOnForm({ name: '', price: '', currency: 'KES', durationMinutes: '', description: '', isActive: true, displayOrder: '0' })
      loadAddOns()
      dispatchAdminDataChanged('addon-changed')
      toast.success(editingAddOnId ? 'Add-on updated successfully.' : 'Add-on created successfully.')
    } catch (err) {
      console.error('Add-on submit error:', err)
      const message = err?.response?.data?.message || err?.message || 'Failed to save add-on'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = new FormData()
      payload.append('title', form.title)
      if (form.description) payload.append('description', form.description)
      if (form.category) payload.append('category', form.category)
      payload.append('mediaType', form.mediaType)
      payload.append('featured', String(form.featured))
      if (form.price) payload.append('price', String(form.price))
      if (form.priceMax) payload.append('priceMax', String(form.priceMax))
      if (form.currency) payload.append('currency', form.currency)
      if (form.priceSuffix) payload.append('priceSuffix', form.priceSuffix)
      if (form.tagline) payload.append('tagline', form.tagline)
      if (form.ctaText) payload.append('ctaText', form.ctaText)
      if (form.packageType) payload.append('packageType', form.packageType)
      if (form.features.length > 0) payload.append('features', JSON.stringify(form.features))

      const file = mainMediaFiles[0]
      if (file && file instanceof File) {
        payload.append('media', file)
      } else if (editingId && file && file.url) {
        // Preserve existing media URL when editing without uploading a new file
        payload.append('imageUrl', file.url)
      }

      if (galleryFiles.length > 0) {
        const existingGalleryUrls = []
        galleryFiles.forEach((file) => {
          if (file instanceof File) {
            payload.append('gallery', file)
          } else if (file && file.url) {
            existingGalleryUrls.push(file.url)
          }
        })
        // Send existing gallery URLs to keep (even if empty, to allow clearing)
        if (editingId) {
          payload.append('existingMediaUrls', JSON.stringify(existingGalleryUrls))
        }
      } else if (editingId) {
        // No gallery files at all — explicitly clear the gallery
        payload.append('existingMediaUrls', JSON.stringify([]))
      }

      if (editingId) {
        await api.patch(`/admin/virtual-designs/${editingId}`, payload)
      } else {
        await api.post('/admin/virtual-designs', payload)
      }
      resetForm()
      load()
      dispatchAdminDataChanged('virtual-changed')
      toast.success(editingId ? 'Virtual design updated successfully.' : 'Virtual design uploaded successfully.')
    } catch (err) {
      console.error('Submit error:', err)
      const message = err?.response?.data?.message || err?.message || 'Failed to save virtual design'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async () => {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)

    setOptimisticDeletes(prev => new Set(prev).add(id))
    setItems(prev => prev.filter(item => (item._id || item.id) !== id))

    try {
      await api.delete(`/admin/virtual-designs/${id}`)
      setOptimisticDeletes(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      load()
      dispatchAdminDataChanged('virtual-changed')
    } catch (err) {
      console.error('Delete error:', err)
      setOptimisticDeletes(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      const message = err?.response?.data?.message || err?.message || 'Failed to delete virtual design'
      setError(message)
      toast.error(message)
    }
   }

  const isVideoType = useCallback((file) => {
    if (!file || typeof file !== 'object') return false
    if (file.type && file.type.startsWith('video/')) return true
    if (file.type === 'video') return true
    return false
  }, [])

  const mainMediaPreview = useMemo(() => {
    if (mainMediaPreviews.length === 0) return null
    const src = mainMediaPreviews[0]
    const file = mainMediaFiles[0]
    if (file && isVideoType(file)) {
      return (
        <video src={src} className="h-40 w-full object-cover" autoPlay muted loop playsInline controls />
      )
    }
    return <img src={src} alt="Main media preview" className="h-40 w-full object-cover" />
  }, [mainMediaPreviews, mainMediaFiles, isVideoType])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">E-Design Packages</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">Manage your eDesign packages, pricing, features, images and booking options.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setMainMediaFiles([]); setMainMediaPreviews([]); setGalleryFiles([]); setGalleryPreviews([]); setShowForm(true) }}
          className="btn-luxury-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2} />
          Add Package
        </motion.button>
      </motion.div>

      {/* Upload Form */}
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
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-xl px-4 py-3 text-sm"
              >
                {error}
              </motion.div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-[var(--primary)]">
                  {editingId ? 'Edit' : 'Add'} E-Design Package
                </h3>
                <p className="text-[10px] text-[var(--primary)]/50 mt-1">
                  {editingId ? 'Update package details' : 'Create a new eDesign package'}
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
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Tagline</label>
              <input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="Short tagline for this package"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Price</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="15000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Max Price</label>
                <input
                  type="number"
                  value={form.priceMax}
                  onChange={(e) => setForm((f) => ({ ...f, priceMax: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="18000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Currency</label>
                <input
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="KES"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Price Suffix</label>
                <input
                  value={form.priceSuffix}
                  onChange={(e) => setForm((f) => ({ ...f, priceSuffix: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="starting from"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Package Type</label>
                <input
                  value={form.packageType}
                  onChange={(e) => setForm((f) => ({ ...f, packageType: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="e.g. mini-refresh"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">CTA Text</label>
              <input
                value={form.ctaText || 'Book'}
                onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="e.g. View More"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Features</label>
              <div className="flex gap-2">
                <input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="Add a feature"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={addFeature}
                  className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--accent)] hover:border-[var(--accent)] transition h-12"
                >
                  Add
                </motion.button>
              </div>
              {form.features.length > 0 && (
                <div className="space-y-2 mt-3">
                  {form.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-[var(--primary)] bg-[var(--bg)]/50 rounded-lg px-3 py-2">
                        {feature}
                      </span>
                      <div className="flex gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => moveFeature(i, -1)}
                          disabled={i === 0}
                          className="p-2 rounded-lg text-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/30 transition disabled:opacity-30"
                        >
                          ↑
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => moveFeature(i, 1)}
                          disabled={i === form.features.length - 1}
                          className="p-2 rounded-lg text-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/30 transition disabled:opacity-30"
                        >
                          ↓
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="p-2 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition"
                        >
                          <X size={14} />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Media Type</label>
                <select
                  value={form.mediaType}
                  onChange={(e) => setForm((f) => ({ ...f, mediaType: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Featured</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                  />
                  <span className="text-sm text-[var(--primary)]">Show in featured section</span>
                </label>
              </div>
            </div>

            {/* Main Media Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
                <Video size={14} strokeWidth={1.5} />
                Main Media (Image or Video, 1 max)
              </label>
              <input ref={mainFileRef} type="file" accept="image/*,video/*" onChange={(e) => handleMainFiles(e.target.files)} className="hidden" />
              <input ref={videoRef} type="file" accept="video/*" onChange={(e) => handleMainFiles(e.target.files)} className="hidden" />
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
                {mainMediaPreview ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--primary)]">Main Media (1 max)</p>
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
                      {mainMediaPreview}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeMainMedia(0) }}
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
                      {form.mediaType === 'video' ? <Video size={28} /> : <Image size={28} />}
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-[var(--primary)]">Drop {form.mediaType === 'video' ? 'video' : 'image'} here or click to browse</p>
                      <p className="text-[10px] text-[var(--primary)]/50 mt-1">{form.mediaType === 'video' ? 'MP4, MOV, WebM up to 50MB' : 'PNG, JPG, WebP up to 10MB'}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Gallery Media Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
                <Images size={14} strokeWidth={1.5} />
                Gallery Media (up to 10)
              </label>
              <input ref={galleryFileRef} type="file" accept="image/*,video/*" multiple onChange={(e) => handleGalleryFiles(e.target.files)} className="hidden" />
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
                      <p className="text-sm font-medium text-[var(--primary)]">Gallery Media ({galleryPreviews.length}/10)</p>
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
                          {galleryFiles[i]?.type?.startsWith('video/') ? (
                            <video src={src} className="h-28 w-full object-cover" autoPlay muted loop controls />
                          ) : (
                            <img src={src} alt="Gallery preview" className="h-28 w-full object-cover" />
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeGalleryMedia(i) }}
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
                      <Images size={28} />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-[var(--primary)]">Drop images or videos here or click to browse</p>
                      <p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG, MP4, MOV, WebM up to 10MB each (max 10)</p>
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

      {/* Items Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item, i) => {
          const isOptimistic = optimisticDeletes.has(item._id || item.id)
          return (
            <motion.div
              layout
              key={item._id || item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isOptimistic ? 0.4 : 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(42,36,31,0.06)] group"
            >
              <div className="relative">
                {item.mediaUrl && item.mediaType === 'video' ? (
                  <video
                    src={getOptimizedVideoUrl(item.mediaUrl, { width: 480 })}
                    poster={getVideoPosterUrl(item.mediaUrl, { width: 480 })}
                    className="h-44 w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : item.mediaUrl && item.mediaType === 'image' ? (
                  <img
                    src={getOptimizedUrl(item.mediaUrl, { width: 480 })}
                    alt={item.title}
                    className="h-44 w-full object-cover"
                  />
                ) : item.galleryMedia && item.galleryMedia.length > 0 ? (
                  item.galleryMedia[0].type?.startsWith('video/') ? (
                    <video
                      src={getOptimizedVideoUrl(item.galleryMedia[0].url, { width: 480 })}
                      poster={getVideoPosterUrl(item.galleryMedia[0].url, { width: 480 })}
                      className="h-44 w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={getOptimizedUrl(item.galleryMedia[0].url, { width: 480 })}
                      alt={item.title}
                      className="h-44 w-full object-cover"
                    />
                  )
                ) : (
                  <div className="h-44 w-full bg-[var(--secondary)]/60 flex items-center justify-center text-[var(--primary)]/30">
                    <Video size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-[var(--primary)]/0 transition-all duration-300 group-hover:bg-[var(--primary)]/30" />

                {/* Media Type Badge */}
                {item.mediaType && (
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-medium uppercase ${
                    item.mediaType === 'video' ? 'bg-blue-500/90 text-white' : 'bg-green-500/90 text-white'
                  }`}>
                    {item.mediaType}
                  </div>
                )}

                {/* Gallery Count Badge */}
                {item.galleryMedia && item.galleryMedia.length > 0 && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
                      <Images size={10} strokeWidth={2} />
                      {item.galleryMedia.length} media
                    </span>
                  </div>
                )}

                {/* Quick Actions - always visible */}
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(item)}
                    className="p-2 bg-white/95 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg border border-[var(--border)]/30"
                    aria-label="Edit project"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteId(item._id || item.id)}
                    className="p-2 bg-white/95 backdrop-blur-sm rounded-xl text-[var(--error)] hover:bg-white shadow-lg border border-[var(--border)]/30"
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-display text-lg text-[var(--primary)]">{item.title}</h3>
                {item.category && (
                  <span className="inline-block mt-1.5 px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-semibold uppercase tracking-wider">
                    {item.category}
                  </span>
                )}
                {item.packageType && (
                  <span className="inline-block mt-1.5 ml-2 px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-semibold uppercase tracking-wider">
                    {item.packageType}
                  </span>
                )}
                <p className="text-xs text-[var(--primary)]/50 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                {item.price && (
                  <p className="text-sm font-medium text-[var(--accent)] mt-2">
                    {item.currency || 'KES'} {Number(item.price).toLocaleString()}
                    {item.priceSuffix && <span className="text-[var(--primary)]/50 ml-1">{item.priceSuffix}</span>}
                  </p>
                )}
                {item.features && item.features.length > 0 && (
                  <p className="text-[10px] text-[var(--primary)]/40 mt-1">{item.features.length} features</p>
                )}
                {item.featured && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
                    <Star size={10} strokeWidth={2} />
                    Featured
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
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
            <p className="text-sm text-[var(--primary)]/40 mt-2">Click "Add Virtual Design" to get started</p>
          </motion.div>
        )}
      </motion.div>

      {/* Add-On Services Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-6 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display text-2xl text-[var(--primary)]">Add-On Services Management</h3>
            <p className="text-sm text-[var(--primary)]/50 mt-1">Manage add-on services offered with Virtual Designs packages.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addAddOn}
            className="btn-luxury-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={2} />
            {editingAddOnId ? 'Cancel' : 'Add Add-On'}
          </motion.button>
        </div>

        {/* Add-On Form */}
        {editingAddOnId !== null && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            onSubmit={submitAddOn}
            className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-xl p-5 space-y-4 mb-6"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-xl px-4 py-3 text-sm"
              >
                {error}
              </motion.div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Service Name</label>
              <input
                value={addOnForm.name}
                onChange={(e) => setAddOnForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="e.g. Virtual Styling Call"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Description</label>
              <textarea
                value={addOnForm.description}
                onChange={(e) => setAddOnForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                placeholder="Describe this add-on service..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Price</label>
                <input
                  type="number"
                  value={addOnForm.price}
                  onChange={(e) => setAddOnForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="5000"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Currency</label>
                <input
                  value={addOnForm.currency}
                  onChange={(e) => setAddOnForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="KES"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Duration (min)</label>
                <input
                  type="number"
                  value={addOnForm.durationMinutes}
                  onChange={(e) => setAddOnForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="120"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
                <input
                  type="number"
                  value={addOnForm.displayOrder}
                  onChange={(e) => setAddOnForm((f) => ({ ...f, displayOrder: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addOnForm.isActive !== 'false' && addOnForm.isActive !== false}
                  onChange={(e) => setAddOnForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                />
                <span className="text-sm text-[var(--primary)]">Active (visible to customers)</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => { setEditingAddOnId(null); setAddOnForm({ name: '', price: '', currency: 'KES', durationMinutes: '', description: '', isActive: true, displayOrder: '0' }); setError('') }}
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
                {loading ? 'Saving...' : editingAddOnId ? 'Update Add-On' : 'Create Add-On'}
              </motion.button>
            </div>
          </motion.form>
        )}

        {/* Add-On List */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addOnServices.length === 0 && addOnsLoading === false && (
            <div className="col-span-full py-12 text-center">
              <p className="text-sm text-[var(--primary)]/50">No add-on services configured yet.</p>
            </div>
          )}
          {addOnServices.map((addon) => (
            <motion.div
              layout
              key={addon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border border-[var(--border)]/60 rounded-xl p-4 bg-white/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-display text-lg text-[var(--primary)]">{addon.name}</h4>
                  {addon.description && (
                    <p className="text-xs text-[var(--primary)]/50 mt-1 line-clamp-2">{addon.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-medium text-[var(--accent)]">
                      {addon.currency} {Number(addon.price).toLocaleString()}
                    </span>
                    {addon.durationMinutes && (
                      <span className="text-xs text-[var(--primary)]/40">{addon.durationMinutes} min</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${
                    addon.isActive ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--error)]/10 text-[var(--error)]'
                  }`}>
                    {addon.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingAddOnId(addon.id)
                      setAddOnForm({
                        name: addon.name,
                        price: String(addon.price),
                        currency: addon.currency || 'KES',
                        durationMinutes: addon.durationMinutes ? String(addon.durationMinutes) : '',
                        description: addon.description || '',
                        isActive: addon.isActive,
                        displayOrder: String(addon.displayOrder),
                      })
                      setError('')
                    }}
                    className="p-2 bg-white/95 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg border border-[var(--border)]/30"
                    aria-label="Edit add-on"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeAddOn(addon.id)}
                    className="p-2 bg-white/95 backdrop-blur-sm rounded-xl text-[var(--error)] hover:bg-white shadow-lg border border-[var(--border)]/30"
                    aria-label="Delete add-on"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Delete this virtual design?</h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">This action cannot be undone.</p>
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
                  className="rounded-full bg-[var(--error)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--error)]/90 hover:shadow-lg"
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

export default VirtualDesignDashboard
