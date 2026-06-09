import { useRef, useState, useEffect, useCallback } from 'react'
import { rtcConfig } from '../utils/webrtcConfig'
import toast from 'react-hot-toast'

export function useWebRTC(roomId, socket, localStream) {
  const peers = useRef({})
  const [remoteStreams, setRemoteStreams] = useState({})
  const [peerMediaStates, setPeerMediaStates] = useState({})
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const localStreamRef = useRef(localStream)
  const screenShareStreamRef = useRef(null)
  const isScreenSharingRef = useRef(false)
  const peerMediaStatesRef = useRef(peerMediaStates)
  peerMediaStatesRef.current = peerMediaStates

  localStreamRef.current = localStream

  const syncLocalStream = useCallback((stream) => {
    localStreamRef.current = stream
    if (!stream) return
    Object.values(peers.current).forEach(pc => {
      const existingKinds = pc.getSenders().map(s => s.track?.kind)
      stream.getTracks().forEach(track => {
        if (!existingKinds.includes(track.kind)) {
          try { pc.addTrack(track, stream) } catch (_) {}
        }
      })
    })
  }, [])

  const replaceTrackForPeers = useCallback(async (kind, newTrack) => {
    for (const pc of Object.values(peers.current)) {
      const sender = pc.getSenders().find(s => s.track?.kind === kind)
      if (sender) {
        try { await sender.replaceTrack(newTrack) } catch (_) {}
      }
    }
  }, [])

  const createPeerConnection = useCallback((peerId) => {
    if (peers.current[peerId]) return peers.current[peerId]

    const pc = new RTCPeerConnection(rtcConfig)

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current))
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { to: peerId, candidate: event.candidate })
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        setRemoteStreams(prev => ({ ...prev, [peerId]: stream }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = { ...prev }
          delete next[peerId]
          return next
        })
      }
    }

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        if (socket) socket.emit('offer', { to: peerId, sdp: offer })
      } catch (_) {}
    }

    peers.current[peerId] = pc
    return pc
  }, [socket])

  const refreshRemoteStreamsForPeers = useCallback(() => {
    for (const [peerId, pc] of Object.entries(peers.current)) {
      const videoReceiver = pc.getReceivers().find(r => r.track?.kind === 'video')
      if (videoReceiver && videoReceiver.track && videoReceiver.track.readyState !== 'ended') {
        setRemoteStreams(prev => ({ ...prev, [peerId]: new MediaStream([videoReceiver.track]) }))
      }
    }
  }, [])

  const startScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) return

    const states = peerMediaStatesRef.current
    const alreadySharingId = Object.keys(states).find(sid => states[sid]?.isScreenSharing)
    if (alreadySharingId) {
      toast.error('Another participant is already sharing their screen')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      screenShareStreamRef.current = stream
      isScreenSharingRef.current = true
      setIsScreenSharing(true)

      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        await replaceTrackForPeers('video', videoTrack)
        // Force a new stream object on remote side so the video element re-renders
        refreshRemoteStreamsForPeers()
      }

      if (socket && roomId) {
        socket.emit('screen-share-started', { roomId })
      }

      videoTrack.addEventListener('ended', () => { stopScreenShare() }, { once: true })
    } catch (_) {}
  }, [socket, roomId, replaceTrackForPeers, refreshRemoteStreamsForPeers])

  const stopScreenShare = useCallback(async () => {
    if (!isScreenSharingRef.current) return

    screenShareStreamRef.current?.getTracks().forEach(track => { try { track.stop() } catch (_) {} })
    screenShareStreamRef.current = null
    isScreenSharingRef.current = false
    setIsScreenSharing(false)

    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0]
      if (cameraTrack) {
        await replaceTrackForPeers('video', cameraTrack)
        refreshRemoteStreamsForPeers()
      }
    }

    if (socket && roomId) {
      socket.emit('screen-share-stopped', { roomId })
    }
  }, [socket, roomId, replaceTrackForPeers, refreshRemoteStreamsForPeers])

  const hangUp = useCallback(() => {
    Object.values(peers.current).forEach(p => p.close())
    peers.current = {}
    setRemoteStreams({})
    setPeerMediaStates({})
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
      const pc = createPeerConnection(socketId)
      if (pc.connectionState === 'new') {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('offer', { to: socketId, sdp: offer })
      }
    }

    const onOffer = async ({ from, sdp }) => {
      const pc = createPeerConnection(from)
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('answer', { to: from, sdp: answer })
    }

    const onAnswer = async ({ from, sdp }) => {
      const pc = peers.current[from]
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    }

    const onIceCandidate = async ({ from, candidate }) => {
      const pc = peers.current[from]
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch (_) {}
      }
    }

    const onUserLeft = ({ socketId }) => {
      const pc = peers.current[socketId]
      if (pc) pc.close()
      delete peers.current[socketId]
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
      // Force refresh remote stream to pick up the replaced track
      refreshRemoteStreamsForPeers()
    }

    const onScreenShareStopped = ({ socketId }) => {
      setPeerMediaStates(prev => ({
        ...prev,
        [socketId]: { ...prev[socketId], isScreenSharing: false }
      }))
      // Force refresh remote stream to restore camera track
      refreshRemoteStreamsForPeers()
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
      setRemoteStreams({})
      setPeerMediaStates({})
    }
  }, [socket, createPeerConnection, refreshRemoteStreamsForPeers])

  useEffect(() => {
    return () => { hangUpRef.current() }
  }, [])

  const createOffer = useCallback(async (peerId) => {
    const pc = createPeerConnection(peerId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    if (socket) socket.emit('offer', { to: peerId, sdp: offer })
  }, [createPeerConnection, socket])

  return { remoteStreams, peerMediaStates, isScreenSharing, createOffer, hangUp, startScreenShare, stopScreenShare, syncLocalStream }
}
