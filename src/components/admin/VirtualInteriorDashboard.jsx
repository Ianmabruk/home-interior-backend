import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Edit,
  Trash2,
  Video,
  Plus,
  Package,
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'

const INITIAL_FORM = {
  title: '',
  description: '',
  services: '',
  category: '',
  tags: '',
  ctaPrimary: 'Start Your Project',
  ctaSecondary: 'Learn More',
  packageName: '',
  packagePrice: '',
  packageDescription: '',
}

export const VirtualInteriorDashboard = () => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [packages, setPackages] = useState([])
  const fileRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/virtual-design')
        setItems(Array.isArray(res.data) ? res.data : res.data?.items || [])
      } catch {
        setItems([])
      }
    }
    load()
  }, [])

  const handleFile = (e) => {
    const f = e.target.files?.[0] || null
    setVideoFile(f)
    if (f?.type?.startsWith('video/')) setVideoPreview(URL.createObjectURL(f))
    else setVideoPreview(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('description', form.description)
      payload.append('services', form.services)
      if (form.category) payload.append('category', form.category)
      if (form.tags) payload.append('tags', form.tags)
      if (form.ctaPrimary) payload.append('ctaPrimary', form.ctaPrimary)
      if (form.ctaSecondary) payload.append('ctaSecondary', form.ctaSecondary)
      if (videoFile) payload.append('media', videoFile)

      if (editingId) {
        await api.patch(`/content/virtual-design/${editingId}`, payload)
        setEditingId(null)
      } else {
        await api.post('/content/virtual-design', payload)
      }
      setForm(INITIAL_FORM)
      setVideoFile(null)
      setVideoPreview(null)
      const res = await api.get('/content/virtual-design')
      setItems(Array.isArray(res.data) ? res.data : res.data?.items || [])
      emitAdminDataChanged({ type: 'virtual-changed' })
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item._id || item.id)
    setForm({
      title: item.title,
      description: item.description,
      services: item.services?.join(', ') || '',
      category: item.category || '',
      tags: item.tags?.join(', ') || '',
      ctaPrimary: item.ctaPrimary || 'Start Your Project',
      ctaSecondary: item.ctaSecondary || 'Learn More',
      packageName: item.packageName || '',
      packagePrice: item.packagePrice || '',
      packageDescription: item.packageDescription || '',
    })
    setVideoPreview(item.videoUrl || null)
    setVideoFile(null)
  }

  const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/content/virtual-design/${deleteId}`)
      setDeleteId(null)
      const res = await api.get('/content/virtual-design')
      setItems(Array.isArray(res.data) ? res.data : res.data?.items || [])
      emitAdminDataChanged({ type: 'virtual-changed' })
    } catch {
      // handle error
    }
  }

  const addPackage = () => {
    setPackages([...packages, { name: '', price: '', description: '' }])
  }

  const updatePackage = (index, field, value) => {
    setPackages(packages.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg)))
  }

  const removePackage = (index) => {
    setPackages(packages.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h2 className="font-['Playfair_Display'] text-3xl text-charcoal">
            Virtual Interior Design
          </h2>
          <p className="text-sm text-textSecondary mt-1">
            Manage virtual design services and packages
          </p>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={submit}
          className="admin-card-glass space-y-5 self-start"
        >
          <div>
            <h3 className="font-['Playfair_Display'] text-xl text-charcoal">
              {editingId ? 'Edit' : 'Add'} Virtual Design
            </h3>
            <p className="text-[10px] text-textSecondary mt-1">
              {editingId ? 'Update design details' : 'Create a new virtual design'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
              Title
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input"
              placeholder="Virtual Design Title"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="textarea"
              placeholder="Describe this virtual design service..."
              required
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
              Services
            </label>
            <input
              value={form.services}
              onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))}
              className="input"
              placeholder="3D Modeling, Rendering, Consultation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="input"
                placeholder="Residential"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
                Tags
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="input"
                placeholder="modern, luxury"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
                Primary CTA
              </label>
              <input
                value={form.ctaPrimary}
                onChange={(e) => setForm((f) => ({ ...f, ctaPrimary: e.target.value }))}
                className="input"
                placeholder="Start Your Project"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
                Secondary CTA
              </label>
              <input
                value={form.ctaSecondary}
                onChange={(e) => setForm((f) => ({ ...f, ctaSecondary: e.target.value }))}
                className="input"
                placeholder="Learn More"
              />
            </div>
          </div>

          <div className="border-t border-border pt-5 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-bronze" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
                Packages & Pricing
              </p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
              {packages.map((pkg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 items-start bg-secondary/60 p-2.5 rounded-xl"
                >
                  <input
                    value={pkg.name}
                    onChange={(e) => updatePackage(i, 'name', e.target.value)}
                    className="input !h-9 text-xs flex-1"
                    placeholder="Package Name"
                  />
                  <input
                    value={pkg.price}
                    onChange={(e) => updatePackage(i, 'price', e.target.value)}
                    className="input !h-9 text-xs w-20"
                    placeholder="$500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => removePackage(i)}
                    className="text-error hover:bg-error/10 p-1.5 rounded-lg"
                  >
                    <Trash2 size={12} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={addPackage}
              className="text-xs text-bronze hover:text-charcoal transition-colors font-medium flex items-center gap-1"
            >
              <Plus size={14} />
              Add Package
            </motion.button>
          </div>

          <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => fileRef.current?.click()}
            className="upload-zone rounded-2xl"
          >
            {videoPreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <video
                  src={videoPreview}
                  className="h-52 w-full object-cover"
                  muted
                  controls
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setVideoFile(null)
                    setVideoPreview(null)
                  }}
                  className="absolute top-3 right-3 bg-charcoal/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-charcoal shadow-lg"
                >
                  <X size={14} />
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bronze/10 to-secondary/40 flex items-center justify-center text-bronze"
                >
                  <Video size={28} />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-charcoal">
                    Drop video here or click to browse
                  </p>
                  <p className="text-[10px] text-textSecondary mt-1">MP4, MOV up to 50MB</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-forest text-white w-full py-3 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-forestDark hover:shadow-lg"
            disabled={loading}
          >
            {loading ? 'Saving…' : editingId ? 'Update Design' : 'Upload Design'}
          </motion.button>
        </motion.form>

        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              layout
              key={item._id || item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="admin-card-glass overflow-hidden group"
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
                ) : (
                  <div className="h-44 w-full bg-secondary/60 flex items-center justify-center text-charcoal/30">
                    <Video size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-charcoal/0 transition-all duration-300 group-hover:bg-charcoal/30" />
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-charcoal hover:bg-white shadow-lg"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteId(item._id || item.id)}
                    className="p-2 bg-error/90 backdrop-blur-sm rounded-xl text-white hover:bg-error shadow-lg"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-['Playfair_Display'] text-lg text-charcoal">{item.title}</h3>
                <p className="text-xs text-textSecondary mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(item.tags || []).slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-bronze/10 text-bronze font-medium"
                    >
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
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-secondary/30 to-bronze/10 flex items-center justify-center mb-4 text-charcoal/30">
                <Video size={32} />
              </div>
              <p className="font-['Playfair_Display'] text-xl text-charcoal/30">
                No virtual designs yet
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center text-error">
                <Trash2 size={24} />
              </div>
              <h3 className="font-['Playfair_Display'] text-xl text-charcoal text-center mb-2">
                Confirm Delete
              </h3>
              <p className="text-sm text-textSecondary text-center mb-6">
                Are you sure? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="btn-secondary"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deleteItem}
                  className="bg-error text-white px-5 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-error/90"
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