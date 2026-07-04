import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

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
    <form onSubmit={submit} className="space-y-8">
      <div>
        <p className="eyebrow mb-3">Welcome back</p>
        <h1 className="font-display text-5xl font-medium text-ink">Sign In</h1>
      </div>

      {error && (
        <p className="border-l-2 border-red-400 pl-4 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-6">
        <div>
          <label className="label">Email Address</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label !mb-0">Password</label>
            <Link to="/forgot-password" className="text-2xs font-medium uppercase tracking-widest text-ink/40 transition hover:text-ink">
              Forgot?
            </Link>
          </div>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />
        </div>
      </div>

      <div className="space-y-4">
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in…' : <>Sign In <ArrowRight size={14} strokeWidth={1.5} /></>}
        </button>
        <p className="text-center text-sm text-ink/45">
          No account?{' '}
          <Link to="/register" className="font-medium text-ink transition hover:text-warm">
            Create one
          </Link>
        </p>
      </div>
    </form>
  )
}
