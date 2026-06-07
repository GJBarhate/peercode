import { Crown, Mic, MicOff, User } from 'lucide-react'

export default function ParticipantList({ participants = [], currentUserId }) {
  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Participants ({participants.length})
      </h3>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {participants && participants.length > 0 ? (
          participants.map((p, idx) => {
            const uniqueKey = p.socketId || p.userId || p.id || `participant-${idx}`;
            return (
              <div
                key={uniqueKey}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                  p.role === 'interviewer' ? 'bg-amber-700' : 'bg-indigo-700'
                }`}>
                  {p.username?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {p.username || 'Unknown'}
                      {(p.userId === currentUserId || p.id === currentUserId) && (
                        <span className="text-gray-500 ml-1 text-xs">(you)</span>
                      )}
                    </span>
                    {p.role === 'interviewer' && (
                      <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{p.role || 'interviewee'}</span>
                </div>
                <div className="flex-shrink-0">
                  {p.isMuted ? (
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-green-400" />
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-xs text-gray-600 text-center py-4">Waiting for participants...</p>
        )}
      </div>
    </div>
  )
}
