import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { api } from '../../services/api'
import { Send, MessageCircle, Sparkles, Clock, Mail } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] } }),
}

export const ChatPage = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

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
    setHasInteracted(true)

    try {
      await api.post('/messages', {
        name: 'Website Visitor',
        email: '',
        subject: 'Chat Support',
        content: input.trim(),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages((prev) => [...prev, {
        id: String(Date.now() + 1),
        role: 'agent',
        text: 'Thank you for your message. Our team will get back to you within 24 hours.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-warm-gold/20 to-champagne/30 mb-4">
            <MessageCircle size={24} strokeWidth={1.5} className="text-warm-gold" />
          </div>
          <p className="eyebrow mb-2 text-warm-gold">Customer Support</p>
          <h1 className="font-display text-4xl font-medium text-ink md:text-5xl">Let's Chat</h1>
          <p className="mt-3 text-sm text-ink/50 max-w-md mx-auto">
            Our design consultants are here to help. Send us a message and we'll respond within 24 hours.
          </p>
        </div>

        {/* Chat Card */}
        <div className="rounded-[2rem] border border-champagne/30 bg-white shadow-soft overflow-hidden">
          {/* Messages Area */}
          <div className="h-[420px] overflow-y-auto bg-gradient-to-b from-primary-bg/30 to-primary-bg p-6 scroll-smooth">
            {!hasInteracted && messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex h-full flex-col items-center justify-center text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-warm-gold/15 to-champagne/25 mb-4">
                  <Sparkles size={28} strokeWidth={1.2} className="text-warm-gold" />
                </div>
                <p className="font-display text-xl font-medium text-ink mb-2">How can we help you today?</p>
                <p className="text-sm text-ink/45 max-w-xs">
                  Whether you need design advice, product information, or a consultation — we're here for you.
                </p>
              </motion.div>
            )}

            <div className="space-y-4">
              {messages.map((message, i) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                    message.role === 'user'
                      ? 'bg-dark-luxury text-white rounded-br-md'
                      : 'bg-white border border-champagne/30 text-ink rounded-bl-md shadow-soft'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className={`mt-1.5 text-2xs ${message.role === 'user' ? 'text-white/60' : 'text-ink/35'}`}>
                      {message.time}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-champagne/20 bg-white p-4">
            <form onSubmit={sendMessage} className="flex items-end gap-3">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="w-full rounded-2xl border border-champagne/40 bg-linen px-4 py-3 pr-10 text-sm outline-none placeholder:text-ink/35 focus:border-warm-gold focus:ring-2 focus:ring-warm-gold/20 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-warm-gold to-warm-gold/80 text-white shadow-lg transition hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Send message"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} strokeWidth={1.5} className="ml-0.5" />
                )}
              </button>
            </form>
            <div className="mt-3 flex items-center gap-4 text-2xs text-ink/35">
              <div className="flex items-center gap-1.5">
                <Clock size={12} strokeWidth={1.5} />
                <span>Typically replies within 24 hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail size={12} strokeWidth={1.5} />
                <span>Or email us directly</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
