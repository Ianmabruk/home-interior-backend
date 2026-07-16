import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (!/\d/.test(form.password)) return setError('Password must contain at least one number.')
    setLoading(true)
    try {
      await register(form.fullName, form.email, form.password)
      navigate('/account')
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.')
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
        <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-3">Join HOK</p>
        <h1 className="font-display text-5xl font-normal text-luxury-text">Create Account</h1>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-error bg-error/5 border border-error/20 px-4 py-3 rounded-xl"
        >
          {error}
        </motion.p>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-luxury-text mb-1.5">Full Name</label>
          <input
            className="input-luxury"
            required
            minLength={2}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            autoComplete="name"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-luxury-text mb-1.5">Email Address</label>
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
          <label className="block text-sm font-medium text-luxury-text mb-1.5">Password</label>
          <input
            className="input-luxury"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <p className="mt-1.5 text-2xs text-luxury-text/35">Min 8 characters, at least 1 number.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-luxury-text mb-1.5">Confirm Password</label>
          <input
            className="input-luxury"
            type="password"
            required
            minLength={8}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            autoComplete="new-password"
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
          {loading ? 'Creating account…' : <>Create Account <ArrowRight size={14} strokeWidth={1.5} /></>}
        </button>
        <p className="text-center text-sm text-luxury-text/45">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-luxury-text transition hover:text-bronze">
            Sign in
          </Link>
        </p>
      </div>
    </motion.form>
  )
}