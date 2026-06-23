import { useState, useEffect, useCallback } from 'react'
import { getRoom } from '../services/api'
import toast from 'react-hot-toast'
import { logger } from '../utils/logger'

export function useRoom(roomId, socket) {
 const [room, setRoom] = useState(null)
 const [participants, setParticipants] = useState([])
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState(null)

 useEffect(() => {
 if (!roomId || roomId === 'new') return
 async function load() {
 setIsLoading(true)
 setError(null)
 try {
 const { data } = await getRoom(roomId)
 setRoom(data)
 setParticipants(data.participants || [])
 } catch (err) {
 setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load room')
 } finally {
 setIsLoading(false)
 }
 }
 load()
 }, [roomId])

 useEffect(() => {
 if (!socket) return

 const onParticipantJoined = (participant) => {
 setParticipants(prev => {
 if (prev.find(p => p.socketId === participant.socketId)) return prev
 return [...prev, participant]
 })
 toast.success(`${participant.username} joined the room`)
 }

 const onParticipantLeft = ({ socketId, username }) => {
 setParticipants(prev => prev.filter(p => p.socketId !== socketId))
 if (username) toast(`${username} left the room`)
 }

 const onRoomUpdated = (updatedRoom) => {
 setRoom(updatedRoom)
 setParticipants(updatedRoom?.participants || [])
 }

 const onRoomEnded = (data) => {
 logger.debug('Room ended:', data)
 toast('Session has ended', { duration: 3000 })
 }

 const onParticipantKicked = (data) => {
 logger.debug('Kicked from room:', data)
 toast.error(data.message || 'You were removed from the session')
 setRoom(null)
 setParticipants([])
 }

 socket.on('participant-joined', onParticipantJoined)
 socket.on('participant-left', onParticipantLeft)
 socket.on('room-updated', onRoomUpdated)
 socket.on('room-ended', onRoomEnded)
 socket.on('participant-kicked', onParticipantKicked)

 return () => {
 socket.off('participant-joined', onParticipantJoined)
 socket.off('participant-left', onParticipantLeft)
 socket.off('room-updated', onRoomUpdated)
 socket.off('room-ended', onRoomEnded)
 socket.off('participant-kicked', onParticipantKicked)
 }
 }, [socket])

 const updateRoom = useCallback((updates) => {
 setRoom(prev => prev ? { ...prev, ...updates } : prev)
 }, [])

 return { room, participants, isLoading, error, updateRoom }
}
