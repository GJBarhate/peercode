import { useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import Spinner from '../common/Spinner'

export default function CodeEditor({
  value,
  language = 'javascript',
  onChange,
  readOnly = false,
  onMount,
  height = '100%'
}) {
  const editorRef = useRef(null)

  const handleMount = (editor, monaco) => {
    editorRef.current = editor

    // Handle paste events - ensure editor stays focused and processes paste correctly
    editor.onDidPaste?.(() => {
      // Re-focus editor after paste to ensure all subsequent input works
      setTimeout(() => editor.focus(), 10)
    })
    
    // Ensure paste works even when video or other elements are clicked
    editor.onKeyDown((e) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 52) { // V key
        // Allow default paste behavior
        e.stopPropagation()
      }
    })

    monaco.editor.defineTheme('peercode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818cf8' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '67e8f9' }
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#374151',
        'editorLineNumber.activeForeground': '#6b7280',
        'editor.selectionBackground': '#312e81',
        'editor.lineHighlightBackground': '#1e293b',
        'editorCursor.foreground': '#818cf8',
        'editor.findMatchBackground': '#3730a3',
        'editorGutter.background': '#0a1124',
        'editorWidget.background': '#111827',
        'editorSuggestWidget.background': '#111827',
        'editorSuggestWidget.border': '#374151'
      }
    })
    monaco.editor.setTheme('peercode-dark')

    if (onMount) onMount(editor, monaco)
  }

  return (
    <div className="w-full h-full">
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleMount}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-950">
            <Spinner size="lg" />
          </div>
        }
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly,
          wordWrap: 'on',
          tabSize: 2,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 12, bottom: 12 },
          bracketPairColorization: { enabled: true },
          suggest: { showKeywords: true },
          quickSuggestions: { other: true, comments: false, strings: false }
        }}
      />
    </div>
  )
}
