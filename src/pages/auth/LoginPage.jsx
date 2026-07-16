import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await login(form.email, form.password)
      const role = response?.data?.user?.role
      if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/account', { replace: true })
      }
    } catch (err) {
      console.error('Login error:', err)
      const message = err?.response?.data?.message || err?.message || 'Invalid email or password.'
      setError(message)
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
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">Welcome back</p>
        <h1 className="font-display text-5xl font-normal text-[var(--primary)]">Sign In</h1>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-[var(--error)] bg-[var(--error)]/5 border border-[var(--error)]/20 px-4 py-3 rounded-xl"
        >
          {error}
        </motion.p>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--primary)] mb-1.5">Email Address</label>
          <input
            className="input-luxury"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-[var(--primary)] mb-0">Password</label>
            <Link to="/forgot-password" className="text-2xs font-medium uppercase tracking-widest text-[var(--primary)]/40 transition hover:text-[var(--accent)]">
              Forgot?
            </Link>
          </div>
          <input
            className="input-luxury"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-luxury-primary w-full"
        >
          {loading ? 'Signing in…' : <>Sign In <ArrowRight size={14} strokeWidth={1.5} /></>}
        </button>
        <p className="text-center text-sm text-[var(--primary)]/45">
          No account?{' '}
          <Link to="/register" className="font-medium text-[var(--primary)] transition hover:text-[var(--accent)]">
            Create one
          </Link>
        </p>
      </div>
    </motion.form>
  )
}