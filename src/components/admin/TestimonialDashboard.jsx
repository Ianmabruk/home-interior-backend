import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Trash2,
  Edit2,
  Plus,
  X,
  Image,
  Star,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

export const TestimonialDashboard = () => {
  const [testimonials, setTestimonials] = useState([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    clientName: '',
    position: '',
    company: '',
    testimonial: '',
    rating: 5,
    displayOrder: 0,
    isActive: true,
    photo: null,
    photoPreview: null,
  })

  const load = async () => {
    try {
      const res = await api.get('/admin/testimonials')
      setTestimonials(res.data || [])
    } catch {
      setTestimonials([])
    }
  }

  useEffect(() => {
    // Data fetching on mount - intentional setState in effect
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/testimonials')
        setTestimonials(res.data || [])
      } catch {
        setTestimonials([])
      }
    }
    fetchData()
  }, [])

  const resetForm = () => {
    setForm({
      clientName: '',
      position: '',
      company: '',
      testimonial: '',
      rating: 5,
      displayOrder: 0,
      isActive: true,
      photo: null,
      photoPreview: null,
    })
    setEditing(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'photo' && value instanceof File) {
            formData.append('photo', value)
          } else {
            formData.append(key, String(value))
          }
        }
      })

      if (editing) {
        await api.patch(`/admin/testimonials/${editing}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/admin/testimonials', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      setStatus(editing ? 'Testimonial updated successfully' : 'Testimonial created successfully')
      resetForm()
      load()
      emitAdminDataChanged({ type: 'testimonials-changed' })
    } catch {
      setStatus('Failed to save testimonial. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditing(item._id || item.id)
    setForm({
      clientName: item.clientName || '',
      position: item.position || '',
      company: item.company || '',
      testimonial: item.testimonial || '',
      rating: item.rating || 5,
      displayOrder: item.displayOrder || 0,
      isActive: item.isActive !== false,
      photo: null,
      photoPreview: item.photoUrl || null,
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/admin/testimonials/${deleteId}`)
      setDeleteId(null)
      load()
      emitAdminDataChanged({ type: 'testimonials-changed' })
    } catch {
      // handle error
    }
  }

  const filtered = testimonials.filter((t) =>
    t.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    t.testimonial?.toLowerCase().includes(search.toLowerCase())
  )

  const renderStars = (rating, size = 14) => (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={i < rating ? 'text-accentOrange fill-accentOrange' : 'text-[var(--border)]'}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Testimonials</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{testimonials.length} testimonials</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg flex items-center gap-1.5"
        >
          <Plus size={12} /> Add Testimonial
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <motion.div whileHover={{ scale: 1.02 }} className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition pl-9 max-w-xs"
            placeholder="Search testimonials..."
          />
        </motion.div>
      </motion.div>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-5 py-3 text-sm border ${status.includes('Failed') ? 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20' : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'}`}
        >
          {status}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/20">
              <Image size={32} />
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30">
              {search ? 'No testimonials found' : 'No testimonials yet'}
            </p>
            <p className="mt-2 text-sm text-[var(--primary)]/50">Click \"Add Testimonial\" to create your first one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Photo</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Client</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Testimonial</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Rating</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Order</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Status</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <motion.tr
                    key={t._id || t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-b border-[var(--border)]/30 transition-all duration-150 hover:bg-[var(--bg)]/40"
                  >
                    <td className="px-4 py-3.5 text-[var(--primary)]">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center overflow-hidden">
                        {t.photoUrl ? (
                          <img src={t.photoUrl} alt={t.clientName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--accent)] text-xs font-semibold">
                            {(t.clientName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--primary)]">
                      <div className="font-medium">{t.clientName}</div>
                      {t.position && <div className="text-xs text-[var(--primary)]/50">{t.position}</div>}
                      {t.company && <div className="text-xs text-[var(--primary)]/40">{t.company}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/70 max-w-md">
                      <p className="line-clamp-2 text-sm leading-relaxed">\"{t.testimonial}\"</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {renderStars(t.rating)}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/60">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium bg-[var(--secondary)]/30">
                        <GripVertical size={10} strokeWidth={1.5} className="text-[var(--primary)]/30" />
                        {t.displayOrder ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${t.isActive ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--primary)]/5 text-[var(--primary)]/50'}`}>
                        {t.isActive ? (
                          <>
                            <Eye size={10} strokeWidth={2} />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={10} strokeWidth={2} />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(t)}
                          className="p-2 rounded-lg text-[var(--primary)]/70 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteId(t._id || t.id)}
                          className="p-2 rounded-lg text-[var(--error)]/70 hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => { resetForm(); }}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" onClick={() => {}} />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleSubmit}
              className="relative bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={resetForm}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/60 transition-colors"
                aria-label="Close form"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h3 className="font-display text-xl text-[var(--primary)]">{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
                <p className="text-xs text-[var(--primary)]/50 mt-1">Fill in the client details and testimonial content</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Client Name *</label>
                    <input
                      value={form.clientName}
                      onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="Client name"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Position</label>
                    <input
                      value={form.position}
                      onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="e.g., Creative Director"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Company</label>
                    <input
                      value={form.company}
                      onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Rating *</label>
                  <div className="flex items-center gap-2">
                    {renderStars(form.rating, 24)}
                    <select
                      value={form.rating}
                      onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                      className="w-24 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    >
                      {[1, 2, 3, 4, 5].map((r) => (
                        <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Testimonial *</label>
                  <textarea
                    value={form.testimonial}
                    onChange={(e) => setForm((f) => ({ ...f, testimonial: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                    placeholder="Client testimonial text..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Client Photo</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          setForm((f) => ({ ...f, photo: file, photoPreview: URL.createObjectURL(file) }))
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`upload-zone ${form.photo ? 'drag-active' : ''}`}>
                      {form.photoPreview ? (
                        <div className="relative">
                          <img src={form.photoPreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover mx-auto mb-2" />
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, photo: null, photoPreview: null }))}
                            className="absolute top-2 right-2 p-1 rounded-full bg-[var(--primary)]/80 text-white hover:bg-[var(--primary)] transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center mb-3 text-[var(--accent)]">
                            <Image size={28} />
                          </div>
                          <p className="text-sm text-[var(--primary)]/60">Click to upload client photo</p>
                          <p className="text-[10px] text-[var(--primary)]/40 mt-1">JPG, PNG up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-[var(--primary)]/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                    />
                    Active (visible on website)
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-[var(--primary)] text-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving…' : (editing ? 'Update Testimonial' : 'Create Testimonial')}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

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
                  onClick={handleDelete}
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

export default TestimonialDashboard