import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'

export const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { resetPassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setMessage('Passwords do not match.')
    if (password.length < 8) return setMessage('Password must be at least 8 characters.')
    if (!token) return setMessage('Invalid reset link.')

    setLoading(true)
    setMessage('')
    try {
      await resetPassword(token, password)
      setMessage('Password reset successful. Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Reset failed. Please try again.')
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
          <h1 className="font-display text-5xl font-normal text-[var(--primary)]">New Password</h1>
        </div>
      </div>

      <p className="text-base text-[var(--primary)]/60 leading-relaxed">
        Enter your new password below. Make sure it's secure and memorable.
      </p>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm px-4 py-3 rounded-xl ${
            message.includes('successful') ? 'text-[var(--success)] bg-[var(--success)]/5 border border-[var(--success)]/20' : 'text-[var(--error)] bg-[var(--error)]/5 border border-[var(--error)]/20'
          }`}
        >
          {message}
        </motion.p>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">New Password</label>
          <input
            className="input-luxury"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Confirm New Password</label>
          <input
            className="input-luxury"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-luxury-primary w-full disabled:opacity-50"
      >
        {loading ? 'Resetting…' : 'Update Password'}
      </button>

      <p className="text-center text-sm text-[var(--primary)]/45">
        Back to{' '}
        <Link to="/login" className="font-medium text-[var(--primary)] transition hover:text-[var(--accent)]">
          Sign In
        </Link>
      </p>
    </motion.form>
  )
}