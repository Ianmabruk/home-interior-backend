import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  X,
  Edit,
  Trash2,
  Search,
  Images,
  GripVertical,
  Filter,
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

const INITIAL_FORM = { title: '', category: '', description: '', order: 0 }

export const PortfolioDashboard = () => {
  const [portfolio, setPortfolio] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/portfolio')
        setPortfolio(Array.isArray(res.data) ? res.data : res.data?.items || [])
      } catch {
        setPortfolio([])
      }
    }
    load()
  }, [])

  const handleFile = (e) => {
    const f = e.target.files?.[0] || null
    setMediaFile(f)
    if (f?.type?.startsWith('image/')) setMediaPreview(URL.createObjectURL(f))
    else setMediaPreview(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files?.[0] || null
    if (f) {
      setMediaFile(f)
      if (f?.type?.startsWith('image/')) setMediaPreview(URL.createObjectURL(f))
      else setMediaPreview(null)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('category', form.category)
      if (form.description) payload.append('description', form.description)
      payload.append('order', String(form.order || 0))
      if (mediaFile) payload.append('media', mediaFile)

      if (editingId) {
        await api.patch(`/content/portfolio/${editingId}`, payload)
        setEditingId(null)
      } else {
        await api.post('/content/portfolio', payload)
      }
      setForm(INITIAL_FORM)
      setMediaFile(null)
      setMediaPreview(null)
      const res = await api.get('/content/portfolio')
      setPortfolio(Array.isArray(res.data) ? res.data : res.data?.items || [])
      emitAdminDataChanged({ type: 'portfolio-changed' })
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
      category: item.category,
      description: item.description || '',
      order: item.order || 0,
    })
    setMediaPreview(item.imageUrl || null)
    setMediaFile(null)
  }

  const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/content/portfolio/${deleteId}`)
      setDeleteId(null)
      const res = await api.get('/content/portfolio')
      setPortfolio(Array.isArray(res.data) ? res.data : res.data?.items || [])
      emitAdminDataChanged({ type: 'portfolio-changed' })
    } catch {
      // handle error
    }
  }

  const categories = Array.from(new Set(portfolio.map((p) => p.category).filter(Boolean)))

  const filtered = portfolio.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-['Playfair_Display'] text-3xl text-[#241711]">Portfolio</h2>
          <p className="text-sm text-[#6D5647] mt-1">{filtered.length} items</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D5647]/50"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 max-w-xs"
              placeholder="Search portfolio..."
            />
          </motion.div>
          {categories.length > 0 && (
            <motion.div whileHover={{ scale: 1.02 }} className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D5647]/50 pointer-events-none"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select pl-9"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </motion.div>
          )}
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
            <h3 className="font-['Playfair_Display'] text-xl text-[#241711]">
              {editingId ? 'Edit' : 'Add'} Portfolio Item
            </h3>
            <p className="text-[10px] text-[#6D5647] mt-1">
              {editingId ? 'Update item details' : 'Upload a new portfolio item'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Title
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input"
              placeholder="Portfolio title"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Category
            </label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="input"
              placeholder="e.g., Living Room, Bedroom"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="textarea"
              placeholder="Describe this portfolio piece..."
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Display Order
            </label>
            <input
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
              type="number"
              className="input"
              placeholder="0"
            />
          </div>

          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <motion.div
            whileHover={{ scale: 1.01 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileRef.current?.click()}
            className={`upload-zone rounded-2xl transition-all duration-300 ${
              isDragOver ? 'drag-active border-[#C69B6D] bg-[#C69B6D]/5' : ''
            }`}
          >
            {mediaPreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={mediaPreview}
                  alt="preview"
                  className="h-52 w-full object-cover"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMediaFile(null)
                    setMediaPreview(null)
                  }}
                  className="absolute top-3 right-3 bg-[#241711]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[#241711] shadow-lg"
                >
                  <X size={14} />
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C69B6D]/10 to-[#E8D3BE]/10 flex items-center justify-center text-[#C69B6D]"
                >
                  <UploadCloud size={28} />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-[#241711]">Drop image here or click to browse</p>
                  <p className="text-[10px] text-[#6D5647] mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-accent w-full"
            disabled={loading}
          >
            {loading ? 'Saving…' : editingId ? 'Update Item' : 'Upload Item'}
          </motion.button>
        </motion.form>

        <div className="grid gap-5 sm:grid-cols-2">
          {filtered.map((item, i) => (
            <motion.div
              layout
              key={item._id || item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="admin-card-glass overflow-hidden group"
            >
              <div className="relative overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-52 w-full bg-gradient-to-br from-[#F8F4EF] to-[#E8D3BE]/30 flex items-center justify-center text-[#6D5647]/30">
                    <Images size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#241711]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[#241711] hover:bg-white shadow-lg"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteId(item._id || item.id)}
                    className="p-2 bg-[#C62828]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[#C62828] shadow-lg"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-['Playfair_Display'] text-lg text-[#241711] truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#C69B6D] mt-1 font-medium">
                      {item.category}
                    </p>
                  </div>
                  <GripVertical size={16} className="text-[#6D5647]/30 flex-shrink-0 mt-1" />
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#E8D3BE]/30 to-[#C69B6D]/10 flex items-center justify-center mb-4 text-[#6D5647]/30">
                <Images size={32} />
              </div>
              <p className="font-['Playfair_Display'] text-xl text-[#241711]/30">
                No portfolio items found
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
              className="absolute inset-0 bg-[#241711]/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#C62828]/10 flex items-center justify-center text-[#C62828]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-['Playfair_Display'] text-xl text-[#241711] text-center mb-2">
                Confirm Delete
              </h3>
              <p className="text-sm text-[#6D5647] text-center mb-6">
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
                  className="btn-danger"
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
