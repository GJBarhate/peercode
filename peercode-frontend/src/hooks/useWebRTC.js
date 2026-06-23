import { useRef, useState, useEffect, useCallback } from 'react'
import { rtcConfig } from '../utils/webrtcConfig'
import { logger } from '../utils/logger'
import toast from 'react-hot-toast'

export function useWebRTC(roomId, socket, localStream) {
 const peers = useRef({})
 const makingOffer = useRef({})
 const pendingCandidates = useRef({})
 const [remoteStreams, setRemoteStreams] = useState({})
 const [peerMediaStates, setPeerMediaStates] = useState({})
 const [connectionStates, setConnectionStates] = useState({})
 const [isScreenSharing, setIsScreenSharing] = useState(false)
 const localStreamRef = useRef(localStream)
 const screenShareStreamRef = useRef(null)
 const isScreenSharingRef = useRef(false)
 const peerMediaStatesRef = useRef(peerMediaStates)
 peerMediaStatesRef.current = peerMediaStates

 localStreamRef.current = localStream

 const flushCandidates = useCallback(async (peerId) => {
 const pc = peers.current[peerId]
 const queued = pendingCandidates.current[peerId]
 if (!pc || !queued || queued.length === 0) return
 pendingCandidates.current[peerId] = []
 for (const candidate of queued) {
 try { await pc.addIceCandidate(candidate) } catch (_) {}
 }
 }, [])

 const syncLocalStream = useCallback((stream) => {
 localStreamRef.current = stream
 if (!stream) return
 Object.values(peers.current).forEach(pc => {
 const senderKinds = pc.getSenders().map(s => s.track?.kind)
 stream.getTracks().forEach(track => {
 if (!senderKinds.includes(track.kind)) {
 try { pc.addTrack(track, stream) } catch (_) {}
 }
 })
 })
 }, [])

 const replaceTrackForPeers = useCallback(async (kind, newTrack) => {
 const renegotiatePeers = []
 for (const [peerId, pc] of Object.entries(peers.current)) {
 let sender = pc.getSenders().find(s => s.track?.kind === kind)
 if (!sender) {
 sender = pc.getSenders().find(s => !s.track && s.transport)
 }
 if (sender) {
 try {
 await sender.replaceTrack(newTrack)
 } catch (err) {
 logger.warn('[WebRTC] replaceTrack failed, adding new track:', err.message)
 try {
 const stream = screenShareStreamRef.current || localStreamRef.current
 pc.addTrack(newTrack, stream)
 renegotiatePeers.push(peerId)
 } catch (_) {}
 }
 } else {
 try {
 const stream = screenShareStreamRef.current || localStreamRef.current
 pc.addTrack(newTrack, stream)
 renegotiatePeers.push(peerId)
 } catch (_) {}
 }
 }
 // Renegotiate when we added new tracks
 for (const peerId of renegotiatePeers) {
 const pc = peers.current[peerId]
 if (!pc) continue
 try {
 makingOffer.current[peerId] = true
 const offer = await pc.createOffer()
 await pc.setLocalDescription(offer)
 if (socket) socket.emit('offer', { to: peerId, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } })
 } catch (err) {
 logger.warn('[WebRTC] renegotiation after addTrack failed:', err.message)
 } finally {
 makingOffer.current[peerId] = false
 }
 }
 }, [socket])

 const createPeerConnection = useCallback((peerId) => {
 if (peers.current[peerId]) return peers.current[peerId]

 const pc = new RTCPeerConnection(rtcConfig)
 pendingCandidates.current[peerId] = []

 if (localStreamRef.current) {
 localStreamRef.current.getTracks().forEach(track => {
 try { pc.addTrack(track, localStreamRef.current) } catch (_) {}
 })
 }

 pc.onicecandidate = (event) => {
 if (event.candidate && socket) {
 socket.emit('ice-candidate', { to: peerId, candidate: event.candidate })
 }
 }

 pc.ontrack = (event) => {
 let stream = event.streams?.[0]
 if (!stream) {
 stream = new MediaStream([event.track])
 }
 setRemoteStreams(prev => {
 const existing = prev[peerId]
 if (existing && event.track) {
 const hasTrack = existing.getTracks().some(t => t.id === event.track.id)
 if (!hasTrack) {
 existing.addTrack(event.track)
 return { ...prev, [peerId]: existing }
 }
 return prev
 }
 return { ...prev, [peerId]: stream }
 })
 }

 pc.onconnectionstatechange = () => {
 const state = pc.connectionState
 setConnectionStates(prev => ({ ...prev, [peerId]: state }))
 if (state === 'failed') {
 pc.restartIce()
 }
 if (state === 'closed') {
 setRemoteStreams(prev => {
 const next = { ...prev }
 delete next[peerId]
 return next
 })
 }
 }

 pc.oniceconnectionstatechange = () => {
 const state = pc.iceConnectionState
 if (state === 'connected' || state === 'completed') {
 setConnectionStates(prev => ({ ...prev, [peerId]: 'connected' }))
 } else if (state === 'disconnected') {
 setConnectionStates(prev => ({ ...prev, [peerId]: 'reconnecting' }))
 } else if (state === 'failed') {
 setConnectionStates(prev => ({ ...prev, [peerId]: 'failed' }))
 }
 }

 peers.current[peerId] = pc
 return pc
 }, [socket])

 const startScreenShare = useCallback(async () => {
 if (isScreenSharingRef.current) return

 const states = peerMediaStatesRef.current
 const alreadySharingId = Object.keys(states).find(sid => states[sid]?.isScreenSharing)
 if (alreadySharingId) {
 toast.error('Another participant is already sharing their screen')
 return
 }

 try {
 const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
 screenShareStreamRef.current = stream
 isScreenSharingRef.current = true
 setIsScreenSharing(true)

 const videoTrack = stream.getVideoTracks()[0]
 const audioTrack = stream.getAudioTracks()[0]
 // replaceTrack() swaps the media a peer connection sends WITHOUT
 // renegotiation — the remote side's existing <video> element keeps its
 // srcObject and automatically starts rendering the new frames. Forcing
 // an extra offer/answer cycle here is unnecessary and risks colliding
 // with the perfect-negotiation logic in onOffer, which can wedge the
 // connection (this was the root cause of "screen share isn't visible
 // to the other person").
 if (videoTrack) await replaceTrackForPeers('video', videoTrack)
 if (audioTrack) await replaceTrackForPeers('audio', audioTrack)

 if (socket && roomId) {
 socket.emit('screen-share-started', { roomId })
 }

 videoTrack.addEventListener('ended', () => { stopScreenShare() }, { once: true })
 } catch (_) {}
 }, [socket, roomId, replaceTrackForPeers])

 const stopScreenShare = useCallback(async () => {
 if (!isScreenSharingRef.current) return

 screenShareStreamRef.current?.getTracks().forEach(track => { try { track.stop() } catch (_) {} })
 screenShareStreamRef.current = null
 isScreenSharingRef.current = false
 setIsScreenSharing(false)

 if (localStreamRef.current) {
 const cameraTrack = localStreamRef.current.getVideoTracks()[0]
 const micTrack = localStreamRef.current.getAudioTracks()[0]
 if (cameraTrack) await replaceTrackForPeers('video', cameraTrack)
 if (micTrack) await replaceTrackForPeers('audio', micTrack)
 }

 if (socket && roomId) {
 socket.emit('screen-share-stopped', { roomId })
 }
 }, [socket, roomId, replaceTrackForPeers])

 const hangUp = useCallback(() => {
 Object.values(peers.current).forEach(p => p.close())
 peers.current = {}
 makingOffer.current = {}
 pendingCandidates.current = {}
 setRemoteStreams({})
 setPeerMediaStates({})
 setConnectionStates({})
 if (screenShareStreamRef.current) {
 screenShareStreamRef.current.getTracks().forEach(t => t.stop())
 screenShareStreamRef.current = null
 }
 isScreenSharingRef.current = false
 setIsScreenSharing(false)
 if (socket && roomId) {
 socket.emit('leave-room', roomId)
 }
 }, [socket, roomId])

 const hangUpRef = useRef(hangUp)
 hangUpRef.current = hangUp

 useEffect(() => {
 if (!socket) return

 const onUserJoined = async ({ socketId }) => {
 try {
 const pc = createPeerConnection(socketId)
 makingOffer.current[socketId] = true
 const offer = await pc.createOffer()
 await pc.setLocalDescription(offer)
 socket.emit('offer', { to: socketId, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } })
 } catch (err) {
 logger.warn('[WebRTC] offer creation failed:', err.message)
 } finally {
 makingOffer.current[socketId] = false
 }
 }

 const onOffer = async ({ from, sdp }) => {
 try {
 let pc = peers.current[from]
 if (!pc) {
 pc = createPeerConnection(from)
 }

 const offerCollision = makingOffer.current[from] || pc.signalingState !== 'stable'
 const isPolite = socket.id < from
 if (offerCollision && !isPolite) {
 return
 }

 if (pc.signalingState === 'have-local-offer') {
 await pc.setLocalDescription({ type: 'rollback' })
 }

 await pc.setRemoteDescription(new RTCSessionDescription(sdp))
 await flushCandidates(from)
 const answer = await pc.createAnswer()
 await pc.setLocalDescription(answer)
 socket.emit('answer', { to: from, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } })
 } catch (err) {
 logger.warn('[WebRTC] onOffer error:', err.message)
 }
 }

 const onAnswer = async ({ from, sdp }) => {
 try {
 const pc = peers.current[from]
 if (!pc) return
 if (pc.signalingState !== 'have-local-offer') return
 await pc.setRemoteDescription(new RTCSessionDescription(sdp))
 await flushCandidates(from)
 } catch (err) {
 logger.warn('[WebRTC] onAnswer error:', err.message)
 }
 }

 const onIceCandidate = async ({ from, candidate }) => {
 if (!candidate) return
 const pc = peers.current[from]
 if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
 if (!pendingCandidates.current[from]) pendingCandidates.current[from] = []
 pendingCandidates.current[from].push(new RTCIceCandidate(candidate))
 return
 }
 try {
 await pc.addIceCandidate(new RTCIceCandidate(candidate))
 } catch (_) {}
 }

 const onUserLeft = ({ socketId }) => {
 const pc = peers.current[socketId]
 if (pc) pc.close()
 delete peers.current[socketId]
 delete makingOffer.current[socketId]
 delete pendingCandidates.current[socketId]
 setRemoteStreams(prev => {
 const next = { ...prev }
 delete next[socketId]
 return next
 })
 setPeerMediaStates(prev => {
 const next = { ...prev }
 delete next[socketId]
 return next
 })
 setConnectionStates(prev => {
 const next = { ...prev }
 delete next[socketId]
 return next
 })
 }

 const onMediaStateChanged = ({ socketId, isMuted, isVideoOff }) => {
 setPeerMediaStates(prev => ({
 ...prev,
 [socketId]: { ...prev[socketId], isMuted, isVideoOff }
 }))
 }

 const onScreenShareStarted = ({ socketId }) => {
 setPeerMediaStates(prev => ({
 ...prev,
 [socketId]: { ...prev[socketId], isScreenSharing: true }
 }))
 }

 const onScreenShareStopped = ({ socketId }) => {
 setPeerMediaStates(prev => ({
 ...prev,
 [socketId]: { ...prev[socketId], isScreenSharing: false }
 }))
 }

 socket.on('participant-joined', onUserJoined)
 socket.on('offer', onOffer)
 socket.on('answer', onAnswer)
 socket.on('ice-candidate', onIceCandidate)
 socket.on('participant-left', onUserLeft)
 socket.on('user-mic-status', onMediaStateChanged)
 socket.on('screen-share-started', onScreenShareStarted)
 socket.on('screen-share-stopped', onScreenShareStopped)

 return () => {
 socket.off('participant-joined', onUserJoined)
 socket.off('offer', onOffer)
 socket.off('answer', onAnswer)
 socket.off('ice-candidate', onIceCandidate)
 socket.off('participant-left', onUserLeft)
 socket.off('user-mic-status', onMediaStateChanged)
 socket.off('screen-share-started', onScreenShareStarted)
 socket.off('screen-share-stopped', onScreenShareStopped)
 Object.values(peers.current).forEach(p => p.close())
 peers.current = {}
 makingOffer.current = {}
 pendingCandidates.current = {}
 setRemoteStreams({})
 setPeerMediaStates({})
 setConnectionStates({})
 }
 }, [socket, createPeerConnection, flushCandidates])

 useEffect(() => {
 return () => { hangUpRef.current() }
 }, [])

 const createOffer = useCallback(async (peerId) => {
 try {
 const pc = createPeerConnection(peerId)
 makingOffer.current[peerId] = true
 const offer = await pc.createOffer()
 await pc.setLocalDescription(offer)
 if (socket) socket.emit('offer', { to: peerId, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } })
 } catch (_) {
 } finally {
 makingOffer.current[peerId] = false
 }
 }, [createPeerConnection, socket])

 const getPeers = useCallback(() => ({ ...peers.current }), [])

 return { remoteStreams, peerMediaStates, connectionStates, isScreenSharing, createOffer, hangUp, startScreenShare, stopScreenShare, syncLocalStream, getPeers }
}
