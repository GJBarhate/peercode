import { useRef, useEffect, useCallback } from 'react'

const CURSOR_COLORS = [
 { bg: 'rgba(99, 102, 241, 0.3)', border: '#6366f1', text: '#6366f1' },
 { bg: 'rgba(236, 72, 153, 0.3)', border: '#ec4899', text: '#ec4899' },
 { bg: 'rgba(16, 185, 129, 0.3)', border: '#10b981', text: '#10b981' },
 { bg: 'rgba(245, 158, 11, 0.3)', border: '#f59e0b', text: '#f59e0b' },
 { bg: 'rgba(139, 92, 246, 0.3)', border: '#8b5cf6', text: '#8b5cf6' },
 { bg: 'rgba(6, 182, 212, 0.3)', border: '#06b6d4', text: '#06b6d4' },
]

let colorIndex = 0
const peerColorMap = new Map()

function getColorForPeer(socketId) {
 if (!peerColorMap.has(socketId)) {
   peerColorMap.set(socketId, CURSOR_COLORS[colorIndex % CURSOR_COLORS.length])
   colorIndex++
 }
 return peerColorMap.get(socketId)
}

export function useRemoteCursors(editor, monaco, socket, roomId) {
 const decorationsRef = useRef(new Map())
 const styleElementRef = useRef(null)
 const remoteCursorsRef = useRef(new Map())

 useEffect(() => {
   if (!editor || !monaco || !socket) return

   if (!styleElementRef.current) {
     styleElementRef.current = document.createElement('style')
     styleElementRef.current.id = 'remote-cursor-styles'
     document.head.appendChild(styleElementRef.current)
   }

   const handleCursorUpdate = (data) => {
     const { socketId, username, lineNumber, column, selection } = data
     if (!socketId || !lineNumber) return

     remoteCursorsRef.current.set(socketId, { username, lineNumber, column, selection, timestamp: Date.now() })

     const color = getColorForPeer(socketId)
     const cursorClass = `remote-cursor-${socketId.replace(/[^a-zA-Z0-9]/g, '')}`
     const selectionClass = `remote-selection-${socketId.replace(/[^a-zA-Z0-9]/g, '')}`
     const labelClass = `remote-label-${socketId.replace(/[^a-zA-Z0-9]/g, '')}`

     const styles = `
       .${cursorClass} {
         border-left: 2px solid ${color.border} !important;
         margin-left: -1px;
       }
       .${selectionClass} {
         background-color: ${color.bg} !important;
       }
       .${labelClass}::after {
         content: '${(username || 'Peer').replace(/'/g, "\\'")}';
         position: absolute;
         top: -18px;
         left: -1px;
         background: ${color.border};
         color: white;
         font-size: 10px;
         font-weight: 600;
         padding: 1px 6px;
         border-radius: 3px 3px 3px 0;
         white-space: nowrap;
         pointer-events: none;
         z-index: 100;
         line-height: 14px;
       }
     `

     if (styleElementRef.current) {
       const existing = styleElementRef.current.textContent || ''
       if (!existing.includes(cursorClass)) {
         styleElementRef.current.textContent += styles
       }
     }

     const newDecorations = []

     newDecorations.push({
       range: new monaco.Range(lineNumber, column, lineNumber, column),
       options: {
         className: cursorClass,
         afterContentClassName: labelClass,
         stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
       },
     })

     if (selection && selection.startLineNumber !== selection.endLineNumber ||
         selection && selection.startColumn !== selection.endColumn) {
       newDecorations.push({
         range: new monaco.Range(
           selection.startLineNumber,
           selection.startColumn,
           selection.endLineNumber,
           selection.endColumn
         ),
         options: {
           className: selectionClass,
           stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
         },
       })
     }

     const oldIds = decorationsRef.current.get(socketId) || []
     const newIds = editor.deltaDecorations(oldIds, newDecorations)
     decorationsRef.current.set(socketId, newIds)
   }

   socket.on('cursor-update', handleCursorUpdate)

   // Clean up stale cursors every 10 seconds
   const cleanupInterval = setInterval(() => {
     const now = Date.now()
     for (const [sid, data] of remoteCursorsRef.current) {
       if (now - data.timestamp > 30000) {
         remoteCursorsRef.current.delete(sid)
         const oldIds = decorationsRef.current.get(sid) || []
         editor.deltaDecorations(oldIds, [])
         decorationsRef.current.delete(sid)
       }
     }
   }, 10000)

   return () => {
     socket.off('cursor-update', handleCursorUpdate)
     clearInterval(cleanupInterval)
     for (const ids of decorationsRef.current.values()) {
       editor.deltaDecorations(ids, [])
     }
     decorationsRef.current.clear()
     remoteCursorsRef.current.clear()
   }
 }, [editor, monaco, socket])

 // Emit local cursor position
 const emitCursorPosition = useCallback(() => {
   if (!editor || !socket || !roomId) return
   const position = editor.getPosition()
   const selection = editor.getSelection()
   if (!position) return

   socket.volatile.emit('cursor-update', roomId, {
     lineNumber: position.lineNumber,
     column: position.column,
     selection: selection ? {
       startLineNumber: selection.startLineNumber,
       startColumn: selection.startColumn,
       endLineNumber: selection.endLineNumber,
       endColumn: selection.endColumn,
     } : null,
   })
 }, [editor, socket, roomId])

 useEffect(() => {
   if (!editor) return
   const disposable1 = editor.onDidChangeCursorPosition(emitCursorPosition)
   const disposable2 = editor.onDidChangeCursorSelection(emitCursorPosition)
   return () => {
     disposable1.dispose()
     disposable2.dispose()
   }
 }, [editor, emitCursorPosition])

 return { remoteCursors: remoteCursorsRef }
}
