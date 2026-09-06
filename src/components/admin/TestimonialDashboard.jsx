import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Trash2,
  Edit2,
  Plus,
  X,
  Image,
  Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'

export const TestimonialDashboard = () => {
  const [testimonials, setTestimonials] = useState([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    photo: null,
    photoPreview: null,
    removePhoto: false,
  })
  const fileInputRef = useRef(null)

  const load = async () => {
    try {
      const res = await api.get('/admin/testimonials')
      setTestimonials(res.data || [])
    } catch {
      setTestimonials([])
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const handler = () => { load() }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [])

  const resetForm = () => {
    setEditing(null)
    setForm({
      photo: null,
      photoPreview: null,
      removePhoto: false,
    })
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((f) => ({
        ...f,
        photo: file,
        photoPreview: URL.createObjectURL(file),
        removePhoto: false,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('clientName', '')
      formData.append('content', '')
      formData.append('project', '')
      formData.append('displayOrder', '0')
      formData.append('isActive', 'true')
      formData.append('initial', '')

      if (form.photo instanceof File) {
        formData.append('photo', form.photo)
      }

      if (editing) {
        if (form.removePhoto) {
          formData.append('removePhoto', 'true')
        }
        await api.patch(`/admin/testimonials/${editing}`, formData)
        toast.success('Testimonial updated successfully.')
      } else {
        await api.post('/admin/testimonials', formData)
        toast.success('Testimonial created successfully.')
      }
      resetForm()
      load()
      dispatchAdminDataChanged('testimonials-changed')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save testimonial.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item) => {
    setEditing(item._id || item.id)
    setForm({
      photo: null,
      photoPreview: item.photoUrl || null,
      removePhoto: false,
    })
    setShowForm(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async () => {
    if (!deleteId || deleteLoading) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/testimonials/${deleteId}`)
      setDeleteId(null)
      load()
      dispatchAdminDataChanged('testimonials-changed')
      toast.success('Testimonial deleted successfully.')
    } catch {
      toast.error('Failed to delete testimonial.')
    } finally {
      setDeleteLoading(false)
    }
  }

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
          onClick={() => { resetForm(); setShowForm(true) }}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden"
      >
        {testimonials.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/20">
              <Image size={32} />
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30">
              No testimonials yet
            </p>
            <p className="mt-2 text-sm text-[var(--primary)]/50">Click "Add Testimonial" to create your first one</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t._id || t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-[var(--bg)]/40 rounded-2xl overflow-hidden border border-[var(--border)]/40"
              >
                <div className="relative aspect-[4/3]">
                   {t.photoUrl ? (
                     <img
                       src={getOptimizedUrl(t.photoUrl, { width: 400, crop: 'fill' })}
                       srcSet={buildSrcSet(t.photoUrl) || undefined}
                       sizes="(max-width: 768px) 50vw, 33vw"
                       alt="Testimonial"
                       className="w-full h-full object-cover"
                       loading="lazy"
                       decoding="async"
                     />
                   ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--primary)]/30">
                      <Image size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[var(--primary)]/0 group-hover:bg-[var(--primary)]/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(t)}
                      className="p-2.5 bg-white rounded-xl text-[var(--primary)] shadow-lg"
                      aria-label="Edit testimonial"
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDeleteId(t._id || t.id)}
                      className="p-2.5 bg-white rounded-xl text-[var(--error)] shadow-lg"
                      aria-label="Delete testimonial"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>
                <div className="p-4">
                  <p className={`text-xs font-medium ${t.isActive ? 'text-[var(--success)]' : 'text-[var(--primary)]/40'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => { resetForm() }}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" onClick={() => {}} />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleSubmit}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
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
                <h3 className="font-display text-xl text-[var(--primary)]">
                  {editing ? 'Replace Testimonial Image' : 'Add Testimonial'}
                </h3>
                <p className="text-xs text-[var(--primary)]/50 mt-1">
                  Upload an image-only testimonial. The image contains the testimonial.
                </p>
              </div>

              <div
                className={`upload-zone ${form.photoPreview ? 'drag-active' : ''} cursor-pointer`}
                onClick={() => !form.photoPreview ? openFilePicker() : null}
              >
                {form.photoPreview ? (
                  <div className="relative">
                         <img
                          src={form.photoPreview}
                          alt="Preview"
                          className="w-full max-h-64 mx-auto object-contain rounded-xl"
                          loading="lazy"
                          decoding="async"
                        />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openFilePicker()
                        }}
                        className="p-1.5 rounded-full bg-white/90 text-[var(--primary)] hover:bg-white shadow-lg"
                        aria-label="Replace image"
                      >
                        <Edit2 size={12} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setForm((f) => ({ ...f, photo: null, photoPreview: null, removePhoto: true }))
                        }}
                        className="p-1.5 rounded-full bg-white/90 text-[var(--error)] hover:bg-white shadow-lg"
                        aria-label="Remove image"
                      >
                        <X size={12} />
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center mb-3 text-[var(--accent)]">
                      <Image size={28} />
                    </div>
                    <p className="text-sm text-[var(--primary)]/60">Click to upload testimonial image</p>
                    <p className="text-[10px] text-[var(--primary)]/40 mt-1">JPG, JPEG, PNG, WebP — up to 10MB</p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex gap-3 justify-end pt-6 border-t border-[var(--border)]/50 mt-6">
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
                  disabled={submitting || (!form.photo && !form.photoPreview)}
                  className="rounded-full bg-[var(--primary)] text-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>{editing ? 'Update Testimonial' : 'Create Testimonial'}</>
                  )}
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

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
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Delete this testimonial?</h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">This action cannot be undone. The image will be removed from storage.</p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  disabled={deleteLoading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="rounded-full bg-[var(--error)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--error)] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    'Delete'
                  )}
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
