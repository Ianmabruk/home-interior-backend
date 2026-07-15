import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../services/api'

export const NewsletterForm = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      await api.post('/newsletter/subscribe', { email })
      setStatus({ type: 'success', message: 'Welcome to the HOK inner circle.' })
      setEmail('')
    } catch (err) {
      setStatus({
        type: 'error',
        message: err?.response?.data?.message || 'Subscription failed. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-charcoal px-6 md:px-12 lg:px-20 py-20 md:py-28">
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center lg:text-left"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-4">
              Design Notes
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight">
              Curated Inspiration
            </h2>
            <p className="mt-5 text-base text-white/50 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Receive design inspiration, exclusive collections, and interior trends directly to your inbox.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg mx-auto w-full"
          >
            <form onSubmit={submit} className="space-y-5">
              <div
                className={`relative rounded-full border transition-all duration-500 ${
                  focused
                    ? 'border-bronze shadow-[0_0_0_4px_rgba(184,138,90,0.1)]'
                    : 'border-white/15'
                } bg-white/5 backdrop-blur-sm`}
              >
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  type="email"
                  required
                  placeholder="Email Address"
                  className="w-full rounded-full bg-transparent py-5 px-7 text-base text-white placeholder:text-white/30 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-bronze text-white transition-all duration-500 hover:bg-bronzeDark hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Subscribe"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                    />
                  ) : (
                    <ArrowRight size={18} strokeWidth={1.5} />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {status.message && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-3 rounded-xl px-5 py-4 ${
                      status.type === 'success'
                        ? 'bg-success/10 border border-success/20'
                        : 'bg-error/10 border border-error/20'
                    }`}
                  >
                    {status.type === 'success' && (
                      <Check size={18} strokeWidth={2} className="text-success flex-shrink-0" />
                    )}
                    <p className={`text-sm ${status.type === 'success' ? 'text-success' : 'text-error'}`}>
                      {status.message}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-[10px] text-white/25 text-center lg:text-left">
                By subscribing, you agree to our Privacy Policy and consent to receive updates.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
