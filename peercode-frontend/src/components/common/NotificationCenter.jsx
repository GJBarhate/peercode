import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Trophy, Zap, CreditCard, Megaphone, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../hooks/useNotifications'

const typeConfig = {
 badge_earned: { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
 elo_change: { icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
 payment: { icon: CreditCard, color: 'text-green-400', bg: 'bg-green-500/10' },
 match_invite: { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
 system: { icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
}

function timeAgo(date) {
 const diff = Date.now() - new Date(date).getTime()
 const mins = Math.floor(diff / 60000)
 if (mins < 1) return 'just now'
 if (mins < 60) return `${mins}m ago`
 const hrs = Math.floor(mins / 60)
 if (hrs < 24) return `${hrs}h ago`
 return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationCenter() {
 const [open, setOpen] = useState(false)
 const panelRef = useRef(null)
 const { notifications, unreadCount, isLoading, fetchNotifications, markAllRead, markRead } = useNotifications()

 useEffect(() => {
 if (open) fetchNotifications()
 }, [open, fetchNotifications])

 useEffect(() => {
 const handleClick = (e) => {
 if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
 }
 document.addEventListener('mousedown', handleClick)
 return () => document.removeEventListener('mousedown', handleClick)
 }, [])

 return (
 <div className="relative" ref={panelRef}>
 <button
 onClick={() => setOpen(v => !v)}
 className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
 aria-label="Notifications"
 >
 <Bell className="w-5 h-5" />
 {unreadCount > 0 && (
 <motion.span
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
 >
 {unreadCount > 99 ? '99+' : unreadCount}
 </motion.span>
 )}
 </button>

 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity: 0, y: -8, scale: 0.97 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -8, scale: 0.97 }}
 transition={{ duration: 0.15 }}
 className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl overflow-hidden bg-bg-surface border border-border-default z-50"
 >
 <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
 <h3 className="font-semibold text-text-primary text-sm">Notifications</h3>
 {unreadCount > 0 && (
 <button
 onClick={markAllRead}
 className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
 >
 <Check className="w-3 h-3" />
 Mark all read
 </button>
 )}
 </div>

 <div className="max-h-[360px] overflow-y-auto">
 {isLoading ? (
 <div className="py-8 text-center text-sm text-text-muted">Loading...</div>
 ) : notifications.length === 0 ? (
 <div className="py-8 text-center text-sm text-text-muted">
 <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
 No notifications yet
 </div>
 ) : (
 notifications.map(notif => {
 const cfg = typeConfig[notif.type] || typeConfig.system
 const Icon = cfg.icon
 return (
 <div
 key={notif._id}
 onClick={() => { if (!notif.isRead) markRead(notif._id); if (notif.link) setOpen(false) }}
 className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-bg-elevated ${!notif.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
 <Icon className={`w-4 h-4 ${cfg.color}`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p className={`text-sm font-medium truncate ${notif.isRead ? 'text-text-muted' : 'text-text-primary'}`}>
 {notif.title}
 </p>
 {!notif.isRead && (
 <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />
 )}
 </div>
 {notif.body && (
 <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.body}</p>
 )}
 <p className="text-[11px] text-text-muted mt-1">{timeAgo(notif.createdAt)}</p>
 </div>
 </div>
 )
 })
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )
}
