import { useEffect, useRef } from 'react'
import CodeEditor from '../editor/CodeEditor'

export default function PlaybackPlayer({ snapshots, currentIndex }) {
 const snapshot = snapshots?.[currentIndex]
 const code = snapshot?.code || ''
 const language = snapshot?.language || 'javascript'

 return (
 <div className="flex flex-col h-full bg-bg-base rounded-xl overflow-hidden border border-border-default">
 <div className="flex items-center justify-between px-4 py-2 bg-bg-surface border-b border-border-default">
 <span className="text-xs font-medium text-text-muted">
 {snapshot ? `Snapshot ${currentIndex + 1} of ${snapshots.length}` : 'No snapshot'}
 </span>
 {snapshot?.timestamp && (
 <span className="text-xs text-text-muted">
 {new Date(snapshot.timestamp).toLocaleTimeString()}
 </span>
 )}
 </div>
 <div className="flex-1">
 <CodeEditor
 value={code}
 language={language}
 readOnly
 height="100%"
 />
 </div>
 </div>
 )
}
