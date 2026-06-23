import { useRef, useState, useEffect, useCallback } from 'react'
import * as Y from 'yjs'

export function useYjsEditor(roomId, socket, editorRef, onStuckDetected) {
 const ydocRef = useRef(null)
 const ytextRef = useRef(null)
 const [language, setLanguage] = useState('javascript')
 const lastEditTimestamp = useRef(Date.now())
 const stuckNotified = useRef(false)
 const boundEditor = useRef(false)
 const cleanupRef = useRef([])

 useEffect(() => {
 ydocRef.current = new Y.Doc()
 ytextRef.current = ydocRef.current.getText('code')
 boundEditor.current = false
 stuckNotified.current = false
 lastEditTimestamp.current = Date.now()

 return () => {
 cleanupRef.current.forEach((dispose) => dispose())
 cleanupRef.current = []
 ydocRef.current?.destroy()
 ydocRef.current = null
 ytextRef.current = null
 boundEditor.current = false
 }
 }, [roomId])

 useEffect(() => {
 if (!socket || !roomId || !ydocRef.current || !ytextRef.current) return

 const ydoc = ydocRef.current

 const onStateResponse = (state) => {
 try {
 Y.applyUpdate(ydoc, new Uint8Array(state), 'remote')
 } catch (_) {}
 }

 const onStateRequest = ({ requesterSocketId }) => {
 if (!requesterSocketId) return
 try {
 const state = Y.encodeStateAsUpdate(ydoc)
 socket.emit('yjs-state-response', requesterSocketId, Array.from(state))
 } catch (_) {}
 }

 const onUpdate = (update) => {
 try {
 Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
 } catch (_) {}
 }

 const onDocUpdate = (update, origin) => {
 if (origin === 'remote') return
 lastEditTimestamp.current = Date.now()
 stuckNotified.current = false
 socket.emit('yjs-update', roomId, Array.from(update))
 }

 socket.on('yjs-state-response', onStateResponse)
 socket.on('yjs-state-request', onStateRequest)
 socket.on('yjs-update', onUpdate)
 ydoc.on('update', onDocUpdate)
 socket.emit('yjs-request-state', roomId)

 return () => {
 socket.off('yjs-state-response', onStateResponse)
 socket.off('yjs-state-request', onStateRequest)
 socket.off('yjs-update', onUpdate)
 ydoc.off('update', onDocUpdate)
 }
 }, [socket, roomId])

 const bindToMonaco = useCallback((editor) => {
 if (!editor || !ytextRef.current || boundEditor.current) return
 boundEditor.current = true
 cleanupRef.current = []
 let isRemoteUpdate = false

 const syncEditor = (event) => {
 const model = editor.getModel()
 if (!model) return
 isRemoteUpdate = true
 const edits = []
 let pos = 0
 for (const op of event.delta) {
 if (op.retain !== undefined) {
 pos += op.retain
 } else if (op.delete !== undefined) {
 const start = model.getPositionAt(pos)
 const end = model.getPositionAt(pos + op.delete)
 edits.push({ range: { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column }, text: '' })
 } else if (typeof op.insert === 'string') {
 const start = model.getPositionAt(pos)
 edits.push({ range: { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: start.lineNumber, endColumn: start.column }, text: op.insert })
 pos += op.insert.length
 }
 }
 if (edits.length > 0) editor.executeEdits('yjs-sync', edits)
 isRemoteUpdate = false
 }

 ytextRef.current.observe(syncEditor)

 const contentDisposable = editor.onDidChangeModelContent((e) => {
 if (isRemoteUpdate) return
 const model = editor.getModel()
 if (!model || !ydocRef.current || !ytextRef.current) return
 ydocRef.current.transact(() => {
 let adj = 0
 for (const change of e.changes) {
 const offset = model.getOffsetAt({
 lineNumber: change.range.startLineNumber,
 column: change.range.startColumn,
 })
 const delLen = change.rangeLength
 if (delLen > 0) {
 ytextRef.current.delete(offset + adj, delLen)
 }
 if (change.text) {
 ytextRef.current.insert(offset + adj, change.text)
 }
 adj += (change.text?.length || 0) - delLen
 }
 })
 })

 cleanupRef.current.push(() => ytextRef.current?.unobserve(syncEditor))
 cleanupRef.current.push(() => contentDisposable.dispose())
 }, [])

 useEffect(() => {
 if (!onStuckDetected) return

 const interval = setInterval(() => {
 if (!stuckNotified.current && Date.now() - lastEditTimestamp.current > 180000) {
 stuckNotified.current = true
 onStuckDetected()
 }
 }, 30000)

 return () => clearInterval(interval)
 }, [onStuckDetected])

 return { language, setLanguage, bindToMonaco }
}
