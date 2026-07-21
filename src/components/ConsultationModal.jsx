import { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'

const EMPTY_FORM = { name: '', email: '', phone: '', message: '' }

export const ConsultationModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const reset = useCallback(() => {
    setForm(EMPTY_FORM)
    setStatus('')
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      await api.post('/consultations', form)
      setStatus('success')
      setTimeout(() => { onClose(); setStatus('') }, 3000)
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            onClick={() => { reset(); onClose() }}
          />
          <motion.div
            key={isOpen ? 'open' : 'closed'}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[560px] bg-white rounded-[28px] p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full text-charcoal/40 transition-colors duration-300 hover:text-charcoal hover:bg-secondary/60"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            <div className="text-center mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-3">Get In Touch</p>
              <h3 className="font-['Playfair_Display'] text-3xl md:text-4xl text-charcoal mb-3">Book a Consultation</h3>
              <p className="text-sm text-textSecondary leading-relaxed max-w-sm mx-auto">
                Tell us about your project and we will get back to you within 24 hours.
              </p>
            </div>

            <AnimatePresence>
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 rounded-2xl bg-success/10 p-5 text-sm text-success text-center border border-success/20"
                >
                  Thank you! We will be in touch soon.
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 rounded-2xl bg-error/10 p-5 text-sm text-error text-center border border-error/20"
                >
                  Something went wrong. Please try again.
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                  placeholder="Full Name"
                  required
                />
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  type="email"
                  className="w-full rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                  placeholder="Phone Number"
                />
              </div>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white resize-none"
                placeholder="Tell us about your project..."
                rows={4}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-forest py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-forestDark hover:shadow-[0_10px_40px_rgba(31,77,58,0.15)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ height: '52px' }}
              >
                {loading ? 'Sending…' : 'Book Consultation'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
