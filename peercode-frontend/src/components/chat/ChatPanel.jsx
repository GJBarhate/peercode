import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageSquare, MessageCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ChatPanel({ socket, roomId }) {
 const { user } = useAuth()
 const [messages, setMessages] = useState([])
 const [input, setInput] = useState('')
 const listRef = useRef(null)

 useEffect(() => {
 if (messages.length > 0) {
 listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
 }
 }, [messages])

 useEffect(() => {
 if (!socket || !roomId) return
 socket.emit('get-chat-history', roomId)
 const onMessage = (msg) => setMessages(prev => [...prev, msg])
 const onHistory = (history) => setMessages(history || [])
 socket.on('chat-message', onMessage)
 socket.on('chat-history', onHistory)
 return () => {
 socket.off('chat-message', onMessage)
 socket.off('chat-history', onHistory)
 }
 }, [socket, roomId])

 const sendMessage = useCallback(() => {
 if (!input.trim() || !socket) return
 socket.emit('chat-message', { roomId, text: input.trim() })
 setInput('')
 }, [input, socket, roomId])

 const handleKeyDown = useCallback((e) => {
 if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
 }, [sendMessage])

 return (
 <div className="flex flex-col h-full bg-bg-base border-l border-border-default">
 <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default bg-bg-surface">
 <MessageSquare className="w-4 h-4 text-indigo-400" aria-hidden="true" />
 <h2 className="text-sm font-semibold text-text-primary">Chat</h2>
 </div>

 <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 space-y-0.5 py-2" role="log" aria-label="Chat messages" aria-live="polite">
 {messages.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full gap-2">
 <MessageCircle className="w-8 h-8 text-text-muted" />
 <p className="text-text-muted text-xs">No messages yet</p>
 <p className="text-text-muted text-xs">Say hello to get started!</p>
 </div>
 ) : (
 messages.map((msg, i) => {
 const isOwn = msg.isOwn || msg.userId === user?.id
 return (
 <div key={msg._id || msg.timestamp || i} className="px-4 py-1">
 <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
 {!isOwn && (
 <span className="text-xs text-text-muted mb-0.5 px-1">{msg.username}</span>
 )}
 <div className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-sm break-words ${
 isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-bg-elevated text-text-primary rounded-bl-sm'
 }`}>
 {msg.text}
 </div>
 <span className="text-xs text-text-muted mt-0.5 px-1">
 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 </div>
 )
 })
 )}
 </div>

 <div className="p-3 border-t border-border-default">
 <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex items-end gap-2">
 <div className="flex-1 flex flex-col gap-1">
 <textarea
 value={input}
 onChange={e => setInput(e.target.value.slice(0, 500))}
 onKeyDown={handleKeyDown}
 placeholder="Type a message..."
 aria-label="Chat message input"
 rows={1}
 maxLength={500}
 className="w-full bg-bg-elevated border border-border-strong text-text-primary rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 placeholder-gray-500 resize-none min-h-[40px] max-h-[100px]"
 style={{ scrollbarWidth: 'none' }}
 />
 {input.length >= 450 && (
 <p className={`text-xs text-right ${input.length >= 490 ? 'text-red-400' : 'text-amber-400'}`}>
 {input.length}/500
 </p>
 )}
 </div>
 <button
 type="submit"
 disabled={!input.trim() || input.length > 500}
 className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
 aria-label="Send message"
 >
 <Send className="w-4 h-4" aria-hidden="true" />
 </button>
 </form>
 </div>
 </div>
 )
}
