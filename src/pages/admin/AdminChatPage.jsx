import { useEffect, useState } from 'react'
import { api } from '../../services/api'

export const AdminChatPage = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      try {
        const res = await api.get('/messages')
        setMessages(res.data || [])
      } catch (err) {
        console.error('Failed to load messages:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
  }, [])

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedMessage) return

    setReplyLoading(true)
    try {
      await api.post('/messages/reply', {
        messageId: selectedMessage._id,
        reply: replyText,
      })
      setReplyText('')
      setSelectedMessage(null)
    } catch (err) {
      console.error('Reply failed:', err)
    } finally {
      setReplyLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-medium">Messages</h1>
        <p className="text-sm text-ink/60 mt-1">View and respond to customer inquiries</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Message List */}
        <div className="rounded-2xl border border-black/10 bg-white">
          <div className="p-4 border-b border-black/10">
            <p className="text-2xs font-medium uppercase tracking-widest text-ink/55">Inbox</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-14 rounded-lg" />
                ))}
              </div>
            )}

            {!loading && messages.length === 0 && (
              <p className="p-8 text-center text-ink/40">No messages yet</p>
            )}

            {!loading && messages.map((msg) => (
              <button
                key={msg._id || msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`w-full p-4 text-left border-b border-black/10 transition ${
                  !msg.isRead ? 'bg-cream' : ''
                } hover:bg-linen`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-ink">{msg.name || msg.email || 'Visitor'}</p>
                  {!msg.isRead && <span className="h-2 w-2 rounded-full bg-orange" />}
                </div>
                <p className="text-sm text-ink/60 truncate">{msg.subject}</p>
                <p className="text-xs text-ink/40 mt-1">{formatDate(msg.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Message View */}
        <div className="rounded-2xl border border-black/10 bg-white">
          {selectedMessage ? (
            <div className="flex h-full flex-col">
              <div className="p-6 border-b border-black/10">
                <h2 className="font-display text-2xl mb-2">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-3 text-sm text-ink/55">
                  <span>{selectedMessage.name}</span>
                  {selectedMessage.email && <span>• {selectedMessage.email}</span>}
                  <span>• {formatDate(selectedMessage.createdAt)}</span>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="rounded-xl bg-cream p-4">
                  <p className="text-sm text-ink/70 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>

              <form onSubmit={sendReply} className="p-6 border-t border-black/10">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30"
                  required
                />
                <div className="mt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 text-xs uppercase tracking-widest border border-black/10 rounded-xl hover:bg-cream"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={replyLoading}
                    className="px-4 py-2 text-xs uppercase tracking-widest bg-orange text-ink rounded-xl hover:bg-orange/90 disabled:opacity-50"
                  >
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-ink/40">Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}