import { useState } from 'react'
import { Wifi, WifiOff, Signal } from 'lucide-react'
import { useSocket } from '../../context/SocketContext'

const QUALITY_CONFIG = {
 good: { color: 'bg-green-500', ring: 'ring-green-500/30', label: 'Excellent', icon: Wifi },
 fair: { color: 'bg-yellow-500', ring: 'ring-yellow-500/30', label: 'Fair', icon: Signal },
 poor: { color: 'bg-red-500', ring: 'ring-red-500/30', label: 'Poor', icon: Signal },
 disconnected: { color: 'bg-red-600', ring: 'ring-red-600/30', label: 'Disconnected', icon: WifiOff },
 unknown: { color: 'bg-gray-400', ring: 'ring-gray-400/30', label: 'Measuring...', icon: Wifi },
}

export default function ConnectionQualityIndicator({ className = '' }) {
 const { connectionQuality, latency, jitter, isConnected } = useSocket()
 const [showTooltip, setShowTooltip] = useState(false)

 const config = QUALITY_CONFIG[connectionQuality] || QUALITY_CONFIG.unknown
 const Icon = config.icon

 return (
   <div
     className={`relative inline-flex items-center ${className}`}
     onMouseEnter={() => setShowTooltip(true)}
     onMouseLeave={() => setShowTooltip(false)}
   >
     <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-elevated/80 backdrop-blur-sm border border-border-default cursor-default select-none`}>
       <span className={`relative flex h-2.5 w-2.5`}>
         {isConnected && connectionQuality !== 'disconnected' && (
           <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-40`} />
         )}
         <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color} ring-2 ${config.ring}`} />
       </span>
       {latency >= 0 && isConnected && (
         <span className="text-[10px] font-mono text-text-muted tabular-nums">{latency}ms</span>
       )}
     </div>

     {showTooltip && (
       <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-48 p-3 rounded-xl bg-bg-surface border border-border-default shadow-xl text-xs pointer-events-none">
         <div className="flex items-center gap-2 mb-2">
           <Icon className="w-3.5 h-3.5 text-text-secondary" />
           <span className="font-semibold text-text-primary">{config.label}</span>
         </div>
         <div className="space-y-1 text-text-muted">
           <div className="flex justify-between">
             <span>Latency</span>
             <span className="font-mono tabular-nums">{latency >= 0 ? `${latency}ms` : '—'}</span>
           </div>
           <div className="flex justify-between">
             <span>Jitter</span>
             <span className="font-mono tabular-nums">{jitter >= 0 ? `${jitter}ms` : '—'}</span>
           </div>
           <div className="flex justify-between">
             <span>Status</span>
             <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
           </div>
         </div>
         <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-bg-surface border-l border-t border-border-default" />
       </div>
     )}
   </div>
 )
}
