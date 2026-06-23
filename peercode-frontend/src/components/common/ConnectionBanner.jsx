import { useEffect, useState, useContext } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import Spinner from './Spinner'
import SocketContext from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'

export default function ConnectionBanner() {
 const socketCtx = useContext(SocketContext)
 const isConnected = socketCtx?.isConnected ?? true
 const { user, isLoading } = useAuth()
 const [wasDisconnected, setWasDisconnected] = useState(false)
 const [showReconnected, setShowReconnected] = useState(false)

 useEffect(() => {
 if (!user) {
 setWasDisconnected(false)
 setShowReconnected(false)
 }
 }, [user])

 useEffect(() => {
 if (!user) return

 if (!isConnected) {
 setWasDisconnected(true)
 } else if (wasDisconnected) {
 setShowReconnected(true)
 const t = setTimeout(() => {
 setShowReconnected(false)
 setWasDisconnected(false)
 }, 2000)
 return () => clearTimeout(t)
 }
 }, [isConnected, wasDisconnected, user])

 if (isLoading || !user) return null

 if (!wasDisconnected && isConnected) return null

 if (showReconnected && isConnected) {
 return (
 <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white text-sm py-2 px-4 flex items-center justify-center gap-2 animate-pulse">
 <Wifi className="w-4 h-4" />
 Connected
 </div>
 )
 }

 if (!isConnected) {
 return (
 <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-text-primary dark:text-black text-sm py-2 px-4 flex items-center justify-center gap-2">
 <WifiOff className="w-4 h-4" />
 <span className="font-medium">Connection lost - reconnecting...</span>
 <Spinner size="sm" className="border-border-strong/30 dark:border-black/30 border-t-black" />
 </div>
 )
 }

 return null
}
