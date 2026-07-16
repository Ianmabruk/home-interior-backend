import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../services/api'
import { motion } from 'framer-motion'

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setMessage('If your account exists, a reset link has been sent.')
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Link to="/login" className="p-2 text-[var(--primary)]/40 hover:text-[var(--primary)] transition-colors" aria-label="Back to login">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-1">Reset Password</p>
          <h1 className="font-display text-5xl font-normal text-[var(--primary)]">Forgot Password</h1>
        </div>
      </div>

      <p className="text-base text-[var(--primary)]/60 leading-relaxed">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm px-4 py-3 rounded-xl ${
            message.includes('sent') ? 'text-[var(--success)] bg-[var(--success)]/5 border border-[var(--success)]/20' : 'text-[var(--error)] bg-[var(--error)]/5 border border-[var(--error)]/20'
          }`}
        >
          {message}
        </motion.p>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Email Address</label>
        <input
          className="input-luxury"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-luxury-primary w-full disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send Reset Link'}
      </button>

      <p className="text-center text-sm text-[var(--primary)]/45">
        Remember your password?{' '}
        <Link to="/login" className="font-medium text-[var(--primary)] transition hover:text-[var(--accent)]">
          Sign In
        </Link>
      </p>
    </motion.form>
  )
}