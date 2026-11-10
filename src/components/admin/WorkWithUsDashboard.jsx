import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from '@components/common/DynamicMotion'
import { Search, Trash2, Edit2, Plus, X, Eye, Image } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'

const STATUSES = ['NEW', 'CONTACTED', 'IN DISCUSSION', 'APPROVED', 'COMPLETED', 'DECLINED']

const STATUS_COLORS = {
  NEW: 'bg-gray-100 text-gray-700 border-gray-200',
  CONTACTED: 'bg-blue-100 text-blue-700 border-blue-200',
  'IN DISCUSSION': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-red-100 text-red-700 border-red-200',
}

export const WorkWithUsDashboard = () => {
  const [activeTab, setActiveTab] = useState('submissions')
  const [submissions, setSubmissions] = useState([])
  const [contentItems, setContentItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    budget: '',
    startDate: '',
    timeline: '',
    status: 'NEW',
  })
  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    image: null,
    imagePreview: null,
    displayOrder: 0,
    isActive: true,
  })
  const [editingContent, setEditingContent] = useState(null)
  const [deleteContentId, setDeleteContentId] = useState(null)
  const [showContentForm, setShowContentForm] = useState(false)

  const refreshSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/work-with-us')
      setSubmissions(res.data || [])
    } catch {
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSubmissions()
  }, [refreshSubmissions])

  useEffect(() => {
    const handler = () => {
      refreshSubmissions()
    }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [refreshSubmissions])

  const loadContent = useCallback(async () => {
    try {
      const res = await api.get('/admin/work-with-us/content')
      setContentItems(res.data || [])
    } catch {
      setContentItems([])
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  useEffect(() => {
    const handler = () => {
      loadContent()
    }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [loadContent])

  const resetForm = () => {
    setForm({ fullName: '', phone: '', email: '', budget: '', startDate: '', timeline: '', status: 'NEW' })
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await api.patch(`/admin/work-with-us/${editing}`, { status: form.status })
      } else {
        await api.post('/work-with-us', form)
      }
      setShowForm(false)
      resetForm()
      refreshSubmissions()
      dispatchAdminDataChanged('work-with-us-changed')
    } catch {
      toast.error('Failed to save submission')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditing(item._id || item.id)
    setForm({
      fullName: item.fullName || '',
      phone: item.phone || '',
      email: item.email || '',
      budget: item.budget || '',
      startDate: item.startDate || '',
      timeline: item.timeline || '',
      status: item.status || 'NEW',
    })
    setShowForm(true)
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/admin/work-with-us/${id}`, { status: newStatus })
      setSubmissions((prev) => prev.map((s) => ((s._id === id || s.id === id) ? { ...s, status: newStatus } : s)))
      if (viewItem && (viewItem._id === id || viewItem.id === id)) {
        setViewItem((prev) => ({ ...prev, status: newStatus }))
      }
      dispatchAdminDataChanged('work-with-us-changed')
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/admin/work-with-us/${deleteId}`)
      setDeleteId(null)
      refreshSubmissions()
      dispatchAdminDataChanged('work-with-us-changed')
      toast.success('Submission deleted successfully')
    } catch {
      toast.error('Failed to delete submission')
    }
  }

  const handleContentSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', contentForm.title)
      formData.append('description', contentForm.description)
      formData.append('displayOrder', String(contentForm.displayOrder || 0))
      formData.append('isActive', String(contentForm.isActive !== false))
      if (contentForm.image) {
        formData.append('image', contentForm.image)
      }
      if (editingContent) {
        await api.patch(`/admin/work-with-us/content/${editingContent}`, formData)
        toast.success('Content updated successfully')
      } else {
        await api.post('/admin/work-with-us/content', formData)
        toast.success('Content created successfully')
      }
      setShowContentForm(false)
      resetContentForm()
      loadContent()
      dispatchAdminDataChanged('work-with-us-changed')
    } catch {
      toast.error('Failed to save content')
    } finally {
      setLoading(false)
    }
  }

  const handleEditContent = (item) => {
    setEditingContent(item._id || item.id)
    setContentForm({
      title: item.title || '',
      description: item.description || '',
      image: null,
      imagePreview: item.imageUrl || null,
      displayOrder: item.displayOrder || 0,
      isActive: item.isActive !== false,
    })
    setShowContentForm(true)
  }

  const handleDeleteContent = async () => {
    if (!deleteContentId) return
    try {
      await api.delete(`/admin/work-with-us/content/${deleteContentId}`)
      setDeleteContentId(null)
      loadContent()
      dispatchAdminDataChanged('work-with-us-changed')
      toast.success('Content deleted successfully')
    } catch {
      toast.error('Failed to delete content')
    }
  }

  const resetContentForm = () => {
    setContentForm({ title: '', description: '', image: null, imagePreview: null, displayOrder: 0, isActive: true })
    setEditingContent(null)
  }

  const filtered = useMemo(() => submissions.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s._id?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
      )
    }
    return true
  }), [search, statusFilter, submissions])

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Work With Us</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">
            {activeTab === 'submissions' ? `${submissions.length} submissions` : `${contentItems.length} content items`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-[var(--border)] bg-white p-1">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'submissions'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--primary)]/60 hover:text-[var(--primary)]'
              }`}
            >
              Submissions
            </button>
            <button
              onClick={() => { setActiveTab('content'); loadContent(); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'content'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--primary)]/60 hover:text-[var(--primary)]'
              }`}
            >
              Section Content
            </button>
          </div>
          {activeTab === 'submissions' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { resetForm(); setShowForm(true); }}
              className="rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg flex items-center gap-1.5"
            >
              <Plus size={12} /> New Submission
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { resetContentForm(); setShowContentForm(true); }}
              className="rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg flex items-center gap-1.5"
            >
              <Plus size={12} /> New Content
            </motion.button>
          )}
        </div>
      </motion.div>

      {activeTab === 'submissions' ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-3"
          >
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition pl-9"
                placeholder="Search by name, email, phone..."
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden"
          >
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/20">
                  <Plus size={32} />
                </div>
                <p className="font-display text-xl text-[var(--primary)]/30">
                  {search ? 'No submissions found' : 'No submissions yet'}
                </p>
                <p className="mt-2 text-sm text-[var(--primary)]/50">Submissions will appear here when customers fill the form</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Name</th>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Email</th>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Phone</th>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Budget</th>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Timeline</th>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Start Date</th>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Status</th>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Date</th>
                      <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <motion.tr
                        key={s._id || s.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group border-b border-[var(--border)]/30 transition-all duration-150 hover:bg-[var(--bg)]/40"
                      >
                        <td className="px-4 py-3.5 text-[var(--primary)]">
                          <div className="font-medium">{s.fullName}</div>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.email}</td>
                        <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.phone}</td>
                        <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.budget}</td>
                        <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.timeline}</td>
                        <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.startDate || '-'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.NEW}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--primary)]/60 text-xs">{formatDate(s.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setViewItem(s)}
                              className="p-2 rounded-lg text-[var(--primary)]/70 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                              title="View"
                            >
                              <Eye size={14} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEdit(s)}
                              className="p-2 rounded-lg text-[var(--primary)]/70 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDeleteId(s._id || s.id)}
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
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden"
        >
          {contentItems.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/20">
                <Image size={32} />
              </div>
              <p className="font-display text-xl text-[var(--primary)]/30">No content items yet</p>
              <p className="mt-2 text-sm text-[var(--primary)]/50">Create content to display on the public Work With Us section</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentItems.map((item, i) => (
                <motion.div
                  key={item._id || item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border border-[var(--border)]/40 rounded-xl overflow-hidden hover:border-[var(--accent)]/40 transition-all group"
                >
                  {item.imageUrl && (
                    <div className="relative h-48 overflow-hidden bg-[var(--bg)]">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditContent(item)}
                          className="p-2 rounded-lg bg-white/90 text-[var(--primary)] hover:text-[var(--accent)] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteContentId(item._id || item.id)}
                          className="p-2 rounded-lg bg-white/90 text-[var(--error)] hover:text-[var(--error)] transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-display text-lg font-medium text-[var(--primary)] line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-[var(--primary)]/60 mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
                        item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-[10px] text-[var(--primary)]/40">Order: {item.displayOrder || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => { if (!editing) resetForm(); setShowForm(false); }}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" />
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
                onClick={() => { resetForm(); setShowForm(false); }}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/60 transition-colors"
                aria-label="Close form"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h3 className="font-display text-xl text-[var(--primary)]">{editing ? 'Edit Submission' : 'New Work With Us Submission'}</h3>
                <p className="text-xs text-[var(--primary)]/50 mt-1">Update the submission details below</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Full Name *</label>
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="Client full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Phone *</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="07XXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Budget *</label>
                    <input
                      value={form.budget}
                      onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="e.g. KES 500,000"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Timeline *</label>
                  <input
                    value={form.timeline}
                    onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="e.g. 3-6 months"
                    required
                  />
                </div>

                {editing && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false); }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-[var(--primary)] text-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving…' : (editing ? 'Update Submission' : 'Create Submission')}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setViewItem(null)}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/60 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <h3 className="font-display text-xl text-[var(--primary)] mb-4">Submission Details</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-[var(--primary)]/50">Name:</span> <span className="text-[var(--primary)] font-medium">{viewItem.fullName}</span></div>
                <div><span className="text-[var(--primary)]/50">Email:</span> <span className="text-[var(--primary)]">{viewItem.email}</span></div>
                <div><span className="text-[var(--primary)]/50">Phone:</span> <span className="text-[var(--primary)]">{viewItem.phone}</span></div>
                <div><span className="text-[var(--primary)]/50">Budget:</span> <span className="text-[var(--primary)]">{viewItem.budget}</span></div>
                <div><span className="text-[var(--primary)]/50">Start Date:</span> <span className="text-[var(--primary)]">{viewItem.startDate || '-'}</span></div>
                <div><span className="text-[var(--primary)]/50">Timeline:</span> <span className="text-[var(--primary)]">{viewItem.timeline}</span></div>
                <div><span className="text-[var(--primary)]/50">Status:</span> <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_COLORS[viewItem.status] || STATUS_COLORS.NEW}`}>{viewItem.status}</span></div>
                <div><span className="text-[var(--primary)]/50">Submitted:</span> <span className="text-[var(--primary)]">{formatDate(viewItem.createdAt)}</span></div>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)]/50">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusUpdate(viewItem._id || viewItem.id, s)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${viewItem.status === s ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-white text-[var(--primary)]/70 border-[var(--border)] hover:border-[var(--accent)]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
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
            onClick={() => setDeleteId(null)}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Delete this submission?</h3>
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

      <AnimatePresence>
        {showContentForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => { if (!editingContent) resetContentForm(); setShowContentForm(false); }}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleContentSubmit}
              className="relative bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => { resetContentForm(); setShowContentForm(false); }}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/60 transition-colors"
                aria-label="Close form"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h3 className="font-display text-xl text-[var(--primary)]">{editingContent ? 'Edit Content' : 'New Work With Us Content'}</h3>
                <p className="text-xs text-[var(--primary)]/50 mt-1">Manage the public Work With Us section content</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Title *</label>
                  <input
                    value={contentForm.title}
                    onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="Section title"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Description</label>
                  <textarea
                    value={contentForm.description}
                    onChange={(e) => setContentForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                    placeholder="Section description"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setContentForm((f) => ({ ...f, image: file }))
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setContentForm((f) => ({ ...f, imagePreview: reader.result }))
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                  />
                  {contentForm.imagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={contentForm.imagePreview} alt="Preview" className="h-32 w-auto rounded-lg object-cover border border-[var(--border)]" />
                      <button
                        type="button"
                        onClick={() => setContentForm((f) => ({ ...f, image: null, imagePreview: null }))}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-[var(--error)] text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
                    <input
                      type="number"
                      value={contentForm.displayOrder}
                      onChange={(e) => setContentForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Status</label>
                    <select
                      value={String(contentForm.isActive)}
                      onChange={(e) => setContentForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => { resetContentForm(); setShowContentForm(false); }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-[var(--primary)] text-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving…' : (editingContent ? 'Update Content' : 'Create Content')}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteContentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteContentId(null)}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Delete this content?</h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteContentId(null)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteContent}
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

export default WorkWithUsDashboard
