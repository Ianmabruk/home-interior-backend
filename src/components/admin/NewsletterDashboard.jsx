import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Trash2,
  Download,
  X,
  User,
  Mail,
  Calendar,
  Send,
  Users,
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

export const NewsletterDashboard = () => {
  const [subscribers, setSubscribers] = useState([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendForm, setSendForm] = useState({ subject: '', message: '' })
  const [showSendForm, setShowSendForm] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/newsletter')
      setSubscribers(res.data?.items || res.data || [])
    } catch {
      setSubscribers([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/admin/newsletter/${deleteId}`)
      setDeleteId(null)
      load()
      emitAdminDataChanged({ type: 'newsletter-changed' })
    } catch {
      // handle error
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/newsletter')
      const items = res.data?.items || res.data || []
      const header = 'Email,Subscribed Date,Status\n'
      const rows = items
        .map((s) => `"${s.email || ''}","${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}","${s.isActive ? 'Active' : 'Inactive'}"`)
        .join('\n')
      const blob = new Blob([header + rows], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'newsletter-subscribers.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // handle error
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!sendForm.subject.trim() || !sendForm.message.trim()) return
    setLoading(true)
    setStatus('')
    try {
      const res = await api.post('/admin/newsletter/send', sendForm)
      setStatus(res.data?.message || 'Newsletter sent successfully')
      setSendForm({ subject: '', message: '' })
      setShowSendForm(false)
    } catch {
      setStatus('Failed to send newsletter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = subscribers.filter((s) =>
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-['Playfair_Display'] text-3xl text-charcoal">Newsletter</h2>
          <p className="text-sm text-textSecondary mt-1">{subscribers.length} subscribers</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 max-w-xs"
              placeholder="Search subscribers..."
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="btn-secondary text-[11px] flex items-center gap-1.5"
          >
            <Download size={12} />
            Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSendForm((p) => !p)}
            className="bg-forest text-white px-5 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-forestDark hover:shadow-lg flex items-center gap-1.5"
          >
            <Send size={12} />
            Send Newsletter
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSendForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSend}
            className="admin-card-glass space-y-4"
          >
            <div>
              <h3 className="font-['Playfair_Display'] text-xl text-charcoal">Send Newsletter</h3>
              <p className="text-xs text-textSecondary mt-1">
                Compose and send an email to all active subscribers
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
                Subject
              </label>
              <input
                value={sendForm.subject}
                onChange={(e) => setSendForm((f) => ({ ...f, subject: e.target.value }))}
                className="input"
                placeholder="Newsletter subject"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/60">
                Message
              </label>
              <textarea
                value={sendForm.message}
                onChange={(e) => setSendForm((f) => ({ ...f, message: e.target.value }))}
                className="textarea"
                placeholder="Write your newsletter message..."
                rows={5}
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setShowSendForm(false)}
                className="btn-secondary"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="bg-forest text-white px-6 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-forestDark disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send to All Subscribers'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-5 py-3 text-sm border ${status.includes('Failed') || status.includes('failed') ? 'bg-error/10 text-error border-error/20' : 'bg-success/10 text-success border-success/20'}`}
        >
          {status}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="admin-card-glass overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-secondary/40 to-bronze/10 flex items-center justify-center mb-4 text-charcoal/20">
              <Users size={32} />
            </div>
            <p className="font-['Playfair_Display'] text-xl text-charcoal/30">
              {search ? 'No subscribers found' : 'No subscribers yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Subscribed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr
                    key={s._id || s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bronze/10 to-secondary/40 flex items-center justify-center text-bronze text-xs font-semibold">
                          {(s.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-charcoal">{s.email}</span>
                      </div>
                    </td>
                    <td className="text-textSecondary">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${s.isActive ? 'bg-success/10 text-success' : 'bg-textSecondary/10 text-textSecondary'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDeleteId(s._id || s.id)}
                        className="p-2 rounded-lg text-error/70 hover:text-error hover:bg-error/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

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
                  onClick={handleDelete}
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
