import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, MessageCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ChatPanel({ socket, roomId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!socket || !roomId) return

    // Request chat history when entering room
    socket.emit('get-chat-history', roomId)

    const onMessage = (msg) => {
      setMessages(prev => [...prev, msg])
    }

    const onHistory = (history) => {
      setMessages(history || [])
    }

    socket.on('chat-message', onMessage)
    socket.on('chat-history', onHistory)

    return () => {
      socket.off('chat-message', onMessage)
      socket.off('chat-history', onHistory)
    }
  }, [socket, roomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !socket) return
    socket.emit('chat-message', { roomId, text: input.trim() })
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handlePaste = async (e) => {
    try {
      const pastedText = e.clipboardData?.getData('text/plain')
      if (pastedText) {
        e.preventDefault()
        setInput(prev => prev + pastedText)
      }
    } catch (err) {
      console.error('Paste failed:', err)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-gray-800">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <MessageSquare className="w-4 h-4 text-indigo-400" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-200">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageCircle className="w-8 h-8 text-gray-600" />
            <p className="text-gray-500 text-xs">No messages yet</p>
            <p className="text-gray-600 text-xs">Say hello to get started!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={msg.id || msg._id || idx}
            className={`flex flex-col ${msg.isOwn || msg.userId === user?.id ? 'items-end' : 'items-start'}`}
            role="article"
          >
            {!msg.isOwn && msg.userId !== user?.id && (
              <span className="text-xs text-gray-500 mb-1 px-1" aria-label={`Message from ${msg.username}`}>{msg.username}</span>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${
                msg.isOwn || msg.userId === user?.id
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-200 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-xs text-gray-600 mt-0.5 px-1" aria-label={`Sent at ${new Date(msg.timestamp).toLocaleTimeString()}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-800">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message..."
            aria-label="Chat message input"
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 placeholder-gray-500 resize-none min-h-[40px] max-h-[100px]"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
            aria-label="Send message (Enter)"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  )
}
