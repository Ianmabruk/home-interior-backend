import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { api } from '../../services/api'

export const NewsletterForm = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/newsletter/subscribe', { email })
      setStatus({ type: 'success', message: 'You\'re subscribed.' })
      setEmail('')
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.message || 'Subscription failed.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="flex items-end gap-3 border-b border-ink/25 pb-1">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Your email address"
          className="flex-1 bg-transparent py-2 text-sm text-ink placeholder:text-ink/35 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex-shrink-0 pb-2 text-orange transition-colors hover:text-ink disabled:opacity-40"
          aria-label="Subscribe"
        >
          <ArrowRight size={18} strokeWidth={1.5} />
        </button>
      </div>
      {status.message && (
        <p className={`mt-2 text-xs ${status.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
          {status.message}
        </p>
      )}
    </form>
  )
}
