import { useState, useEffect, useRef } from 'react'
import { api } from '../../services/api'

const initialMessages = [
  { id: 'm1', role: 'agent', text: 'Welcome to HOK support. How can we help you today?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), userId: null },
]

export const ChatPage = () => {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (event) => {
    event.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: String(Date.now()),
      role: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      await api.post('/messages', {
        name: 'Website Visitor',
        email: '',
        subject: 'Chat Support',
        content: input.trim(),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
        <h1 className="font-display text-5xl">Customer Support</h1>
        <div className="mt-6 h-[460px] space-y-3 overflow-y-auto rounded-xl bg-cream p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                message.role === 'user' ? 'ml-auto bg-ink text-white' : 'bg-white text-ink'
              }`}
            >
              <p>{message.text}</p>
              <p className={`mt-1 text-[10px] ${message.role === 'user' ? 'text-white/70' : 'text-ink/40'}`}>
                {message.time}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30"
            placeholder="Type your message..."
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-orange px-4 py-2 text-xs uppercase tracking-[0.14em] font-medium text-ink transition hover:bg-orange/90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
        <p className="mt-3 text-2xs text-ink/40">
          Your message will be sent to our support team. We'll respond via email.
        </p>
      </section>
    </div>
  )
}