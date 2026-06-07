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

  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc()
    ytextRef.current = ydocRef.current.getText('code')
  }

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

    const syncEditor = () => {
      const newCode = ytextRef.current.toString()
      const model = editor.getModel()
      if (model && model.getValue() !== newCode) {
        model.setValue(newCode)
      }
    }

    ytextRef.current.observe(syncEditor)

    const contentDisposable = editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      if (!model || !ydocRef.current || !ytextRef.current) return
      const code = model.getValue()
      if (ytextRef.current.toString() !== code) {
        ydocRef.current.transact(() => {
          ytextRef.current.delete(0, ytextRef.current.length)
          ytextRef.current.insert(0, code)
        })
      }
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

  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((dispose) => dispose())
      cleanupRef.current = []
      ydocRef.current?.destroy()
      ydocRef.current = null
      ytextRef.current = null
    }
  }, [])

  return { language, setLanguage, bindToMonaco }
}
