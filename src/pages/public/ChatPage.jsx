import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, User, Bot } from 'lucide-react'
import { api } from '@services/api'
import { PageMeta } from '@hooks/usePageMeta'

export const ChatPage = () => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get('/chat')
      setMessages(res.data || [])
    } catch (err) {
      console.warn('[CHAT] Failed to load messages:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    const message = newMessage.trim()
    setNewMessage('')
    setSending(true)

    try {
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: message,
        sender: 'user',
        createdAt: new Date().toISOString(),
        status: 'sending',
      }
      setMessages((prev) => [...prev, optimisticMessage])

      const res = await api.post('/chat', { message })
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticMessage.id),
        res.data,
      ])
    } catch (err) {
      console.error('[CHAT] Failed to send:', err)
      setMessages((prev) => prev.filter((m) => m.id !== `temp-${Date.now()}`))
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      <PageMeta
        title="Chat — HOK Interior Designs"
        description="Chat with our design team for personalized assistance."
      />
      <section className="relative min-h-[30vh] md:min-h-[40vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight"
          >
            Chat
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Connect with our design team for personalized assistance, project inquiries, and design consultations.
          </motion.p>
        </div>
      </section>

      <section className="flex-1 flex flex-col px-6 md:px-12 lg:px-20 py-8 md:py-12">
        <div className="container-wide flex-1 flex flex-col max-w-4xl mx-auto w-full">
          <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[var(--border)]/40 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="h-16 w-16 text-[var(--primary)]/30 mb-4" />
                  <h3 className="font-display text-xl text-[var(--primary)] mb-2">No messages yet</h3>
                  <p className="text-[var(--primary)]/60 max-w-md">Start a conversation with our design team. We&apos;re here to help!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--secondary)]/30 text-[var(--primary)]'}`}>
                      {msg.sender === 'user' ? <User size={20} strokeWidth={1.5} /> : <Bot size={20} strokeWidth={1.5} />}
                    </div>
                    <div className={`max-w-[75%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--secondary)]/30 text-[var(--primary)]'}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                      <p className={`mt-1 text-xs ${msg.sender === 'user' ? 'text-[var(--primary)]/40' : 'text-[var(--primary)]/40'} text-right`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-6 border-t border-[var(--border)]/40">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 input-luxury"
                  disabled={sending}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-colors hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={20} strokeWidth={1.5} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ChatPage