import { useState, useEffect, useCallback, useRef } from 'react'
import { io as socketIO } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import api, { getAccessToken, API_BASE_URL } from '../services/api'

const socketUrl = (API_BASE_URL || '').replace(/\/api\/?$/, '')

export function useNotifications() {
 const { user } = useAuth()
 const [notifications, setNotifications] = useState([])
 const [unreadCount, setUnreadCount] = useState(0)
 const [isLoading, setIsLoading] = useState(false)
 const socketRef = useRef(null)

 useEffect(() => {
 if (!user) return

 const token = getAccessToken()
 if (!token) return

 const sock = socketIO(`${socketUrl}/notifications`, {
 auth: { token },
 transports: ['websocket', 'polling'],
 })
 socketRef.current = sock

 sock.on('unread-count', (count) => setUnreadCount(count))
 sock.on('new-notification', (notif) => {
 setNotifications(prev => [notif, ...prev])
 setUnreadCount(prev => prev + 1)
 })

 return () => {
 sock.disconnect()
 socketRef.current = null
 }
 }, [user])

 const fetchNotifications = useCallback(async () => {
 setIsLoading(true)
 try {
 const { data } = await api.get('/notifications')
 setNotifications(data.data?.notifications || data.notifications || [])
 } catch {
 } finally {
 setIsLoading(false)
 }
 }, [])

 const markAllRead = useCallback(async () => {
 try {
 await api.patch('/notifications/read-all')
 setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
 setUnreadCount(0)
 } catch {
 }
 }, [])

 const markRead = useCallback(async (id) => {
 try {
 await api.patch(`/notifications/${id}/read`)
 setNotifications(prev =>
 prev.map(n => n._id === id ? { ...n, isRead: true } : n)
 )
 setUnreadCount(prev => Math.max(0, prev - 1))
 } catch {
 }
 }, [])

 return { notifications, unreadCount, isLoading, fetchNotifications, markAllRead, markRead }
}
