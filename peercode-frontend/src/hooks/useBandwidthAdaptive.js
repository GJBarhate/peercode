import { useRef, useEffect, useCallback, useState } from 'react'
import { logger } from '../utils/logger'

const QUALITY_PRESETS = {
 high: { width: 640, height: 480, frameRate: 30 },
 medium: { width: 480, height: 360, frameRate: 24 },
 low: { width: 320, height: 240, frameRate: 15 },
 minimal: { width: 160, height: 120, frameRate: 10 },
}

const CHECK_INTERVAL = 5000
const BITRATE_HIGH = 500000
const BITRATE_LOW = 150000

export function useBandwidthAdaptive(peerConnections, localStream) {
 const [videoQuality, setVideoQuality] = useState('high')
 const prevBytesRef = useRef(new Map())
 const intervalRef = useRef(null)

 const adjustQuality = useCallback(async (preset) => {
   if (!localStream) return
   const videoTrack = localStream.getVideoTracks()[0]
   if (!videoTrack) return

   try {
     const constraints = QUALITY_PRESETS[preset]
     await videoTrack.applyConstraints({
       width: { ideal: constraints.width },
       height: { ideal: constraints.height },
       frameRate: { ideal: constraints.frameRate },
     })
     setVideoQuality(preset)
     logger.debug(`[Adaptive] Video quality adjusted to ${preset}`)
   } catch (err) {
     logger.warn('[Adaptive] Failed to apply constraints:', err.message)
   }
 }, [localStream])

 useEffect(() => {
   if (!peerConnections) return

   intervalRef.current = setInterval(async () => {
     const peers = typeof peerConnections === 'function' ? peerConnections() : peerConnections
     if (!peers || typeof peers !== 'object') return

     const entries = Object.entries(peers)
     if (entries.length === 0) return

     let totalBitrate = 0
     let peerCount = 0

     for (const [peerId, pc] of entries) {
       if (!pc || pc.connectionState === 'closed') continue
       try {
         const stats = await pc.getStats()
         let bytesSent = 0
         stats.forEach(report => {
           if (report.type === 'outbound-rtp' && report.kind === 'video') {
             bytesSent = report.bytesSent || 0
           }
         })

         const prev = prevBytesRef.current.get(peerId) || { bytes: 0, time: Date.now() }
         const now = Date.now()
         const elapsed = (now - prev.time) / 1000
         if (elapsed > 0 && prev.bytes > 0) {
           const bitrate = ((bytesSent - prev.bytes) * 8) / elapsed
           totalBitrate += bitrate
           peerCount++
         }
         prevBytesRef.current.set(peerId, { bytes: bytesSent, time: now })
       } catch (_) {}
     }

     if (peerCount === 0) return
     const avgBitrate = totalBitrate / peerCount

     let targetPreset = 'high'
     if (avgBitrate < BITRATE_LOW) {
       targetPreset = 'minimal'
     } else if (avgBitrate < BITRATE_HIGH) {
       targetPreset = 'medium'
     }

     setVideoQuality(prev => {
       if (prev !== targetPreset) {
         adjustQuality(targetPreset)
       }
       return targetPreset
     })
   }, CHECK_INTERVAL)

   return () => {
     if (intervalRef.current) clearInterval(intervalRef.current)
   }
 }, [peerConnections, adjustQuality])

 return { videoQuality, adjustQuality }
}
