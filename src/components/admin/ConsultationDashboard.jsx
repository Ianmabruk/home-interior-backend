import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

const STATUSES = ['new', 'read', 'archived', 'completed']

const STATUS_CONFIG = {
  new: { label: 'New', class: 'badge-neutral', color: '#6D5647' },
  read: { label: 'Read', class: 'badge-warning', color: '#C69B6D' },
  archived: { label: 'Archived', class: 'badge-error', color: '#C62828' },
  completed: { label: 'Completed', class: 'badge-success', color: '#2E7D32' },
}

export const ConsultationDashboard = () => {
  const [consultations, setConsultations] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = {
          status: filter === 'all' ? undefined : filter,
          search: search || undefined,
          page,
          pageSize: 10,
        }
        const res = await api.get('/admin/consultations', { params })
        setConsultations(res.data?.items || [])
        setTotal(res.data?.total || 0)
        setTotalPages(res.data?.totalPages || 1)
      } catch {
        setConsultations([])
      }
    }
    loadData()
  }, [filter, search, page])

  const refresh = async () => {
    try {
      const params = {
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
        page,
        pageSize: 10,
      }
      const res = await api.get('/admin/consultations', { params })
      setConsultations(res.data?.items || [])
      setTotal(res.data?.total || 0)
      setTotalPages(res.data?.totalPages || 1)
    } catch {
      setConsultations([])
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/consultations/${id}/status`, { status })
      refresh()
      emitAdminDataChanged({ type: 'consultations-changed' })
    } catch {
      // handle error
    }
  }

  const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/admin/consultations/${deleteId}`)
      setDeleteId(null)
      refresh()
      emitAdminDataChanged({ type: 'consultations-changed' })
    } catch {
      // handle error
    }
  }

  const handleReply = async () => {
    if (!viewItem || !replyText.trim()) return
    try {
      await api.patch(`/admin/consultations/${viewItem._id || viewItem.id}/status`, {
        status: 'completed',
      })
      setViewItem(null)
      setReplyText('')
      refresh()
      emitAdminDataChanged({ type: 'consultations-changed' })
    } catch {
      // handle error
    }
  }

  const exportCsv = async () => {
    try {
      const res = await api.get('/admin/consultations/export')
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'consultations.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // handle error
    }
  }

  const statusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.new
    return (
      <span className={config.class}>{config.label}</span>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-['Playfair_Display'] text-3xl text-[#241711]">Consultations</h2>
          <p className="text-sm text-[#6D5647] mt-1">{total} records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D5647]/50"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input pl-9 max-w-xs"
              placeholder="Search consultations..."
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }}>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setPage(1)
              }}
              className="select"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportCsv}
            className="btn-secondary text-2xs flex items-center gap-1.5"
          >
            <Download size={12} />
            Export
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="admin-card-glass overflow-hidden"
      >
        {consultations.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#E8D3BE]/30 to-[#C69B6D]/10 flex items-center justify-center mb-4 text-[#6D5647]/30">
              <MessageSquare size={32} />
            </div>
            <p className="font-['Playfair_Display'] text-xl text-[#241711]/30">
              No consultations
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((c, i) => (
                  <motion.tr
                    key={c._id || c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C69B6D]/10 to-[#E8D3BE]/10 flex items-center justify-center text-[#C69B6D] text-xs font-semibold">
                          {(c.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="text-[#6D5647]">{c.email}</td>
                    <td className="text-[#6D5647]">{c.phone || '—'}</td>
                    <td className="text-[#6D5647] max-w-xs truncate">{c.message}</td>
                    <td className="text-[#6D5647]">
                      {c.preferredDate
                        ? new Date(c.preferredDate).toLocaleDateString()
                        : c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="text-[#6D5647]">{c.preferredTime || '—'}</td>
                    <td>{statusBadge(c.status || 'new')}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setViewItem(c)}
                          className="btn-ghost text-2xs flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateStatus(c._id || c.id, 'completed')}
                          className="text-[10px] font-medium text-[#2E7D32] hover:text-[#1B5E20] hover:bg-[#2E7D32]/10 px-2 py-1.5 rounded-lg transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          Archive
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteId(c._id || c.id)}
                          className="btn-danger text-2xs flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Delete
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

      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 pt-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-2xs px-4 py-2.5 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </motion.button>
          <span className="text-sm text-[#6D5647] font-medium">
            Page {page} of {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary text-2xs px-4 py-2.5 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </motion.button>
        </motion.div>
      )}

      <AnimatePresence>
        {viewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-[#241711]/40 backdrop-blur-sm"
              onClick={() => {
                setViewItem(null)
                setReplyText('')
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="flex justify-between items-start mb-5">
                <h3 className="font-['Playfair_Display'] text-2xl text-[#241711]">
                  Consultation Details
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setViewItem(null)
                    setReplyText('')
                  }}
                  className="p-2 rounded-full hover:bg-[#F8F4EF] transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="space-y-3">
                {[
                  { icon: User, label: 'Name', value: viewItem.name },
                  { icon: Mail, label: 'Email', value: viewItem.email },
                  { icon: Phone, label: 'Phone', value: viewItem.phone || '—' },
                  { icon: Calendar, label: 'Date', value: viewItem.preferredDate ? new Date(viewItem.preferredDate).toLocaleDateString() : '—' },
                  { icon: Clock, label: 'Time', value: viewItem.preferredTime || '—' },
                  { icon: CheckCircle2, label: 'Status', value: viewItem.status || 'new' },
                ].map((field, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-gradient-to-r from-[#F8F4EF] to-[#E8D3BE]/10 rounded-xl p-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#C69B6D]/10 flex items-center justify-center text-[#C69B6D] flex-shrink-0">
                      <field.icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                        {field.label}
                      </p>
                      <p className="text-sm text-[#241711] mt-0.5 font-medium">{field.value}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70 mb-2 flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    Message
                  </p>
                  <p className="text-sm leading-relaxed text-[#241711] bg-gradient-to-r from-[#F8F4EF] to-[#E8D3BE]/10 rounded-xl p-4">
                    {viewItem.message}
                  </p>
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70 mb-2">
                    Reply
                  </p>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="textarea"
                    placeholder="Type your reply..."
                    rows={3}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReply}
                    className="btn-accent mt-3"
                    disabled={!replyText.trim()}
                  >
                    Send Reply
                  </motion.button>
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
