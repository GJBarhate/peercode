import FocusTrap from 'focus-trap-react'
import { Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function SessionExpiryModal() {
 const { showExpiryWarning, renewSession, dismissExpiryAndLogout } = useAuth()
 if (!showExpiryWarning) return null

 return (
 <FocusTrap>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
 <div className="relative bg-bg-surface border border-border-strong rounded-2xl shadow-2xl p-6 max-w-sm w-full">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
 <Clock className="w-5 h-5 text-amber-400" />
 </div>
 <h2 className="text-base font-bold text-text-primary">Session Expiring Soon</h2>
 </div>
 <p className="text-sm text-text-muted mb-5">
 Your session expires in about 5 minutes. Stay logged in to keep working.
 </p>
 <div className="flex gap-3">
 <button
 onClick={renewSession}
 className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
 >
 Stay Logged In
 </button>
 <button
 onClick={dismissExpiryAndLogout}
 className="flex-1 py-2.5 rounded-xl bg-bg-elevated hover:bg-bg-overlay text-text-secondary text-sm font-semibold transition-colors"
 >
 Log Out
 </button>
 </div>
 </div>
 </div>
 </FocusTrap>
 )
}
