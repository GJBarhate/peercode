import { useRef, useEffect } from 'react'
import MonacoEditor from '@monaco-editor/react'
import Spinner from '../common/Spinner'
import { useTheme } from '../../context/ThemeContext'

const MONACO_THEMES = {
 light: {
 base: 'vs',
 inherit: true,
 rules: [
 { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
 { token: 'keyword', foreground: '4f46e5' },
 { token: 'string', foreground: '15803d' },
 { token: 'number', foreground: 'b45309' },
 { token: 'type', foreground: '0891b2' }
 ],
 colors: {
 'editor.background': '#ffffff',
 'editor.foreground': '#1f2937',
 'editorLineNumber.foreground': '#9ca3af',
 'editorLineNumber.activeForeground': '#4b5563',
 'editor.selectionBackground': '#c7d2fe',
 'editor.lineHighlightBackground': '#f3f4f6',
 'editorCursor.foreground': '#4f46e5',
 'editor.findMatchBackground': '#fde68a',
 'editorGutter.background': '#f9fafb',
 'editorWidget.background': '#ffffff',
 'editorSuggestWidget.background': '#ffffff',
 'editorSuggestWidget.border': '#e5e7eb'
 }
 },
 dark: {
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
 },
 dawn: {
 base: 'vs',
 inherit: true,
 rules: [
 { token: 'comment', foreground: 'b09878', fontStyle: 'italic' },
 { token: 'keyword', foreground: 'c2410c' },
 { token: 'string', foreground: '15803d' },
 { token: 'number', foreground: '92400e' },
 { token: 'type', foreground: '0e7490' }
 ],
 colors: {
 'editor.background': '#fffcf8',
 'editor.foreground': '#1c1410',
 'editorLineNumber.foreground': '#c4a882',
 'editorLineNumber.activeForeground': '#8a6e50',
 'editor.selectionBackground': '#fed7aa',
 'editor.lineHighlightBackground': '#fef3e2',
 'editorCursor.foreground': '#ea580c',
 'editor.findMatchBackground': '#fde68a',
 'editorGutter.background': '#fdf8f3',
 'editorWidget.background': '#fffcf8',
 'editorSuggestWidget.background': '#fffcf8',
 'editorSuggestWidget.border': '#e8d5bb'
 }
 },
 emerald: {
 base: 'vs-dark',
 inherit: true,
 rules: [
 { token: 'comment', foreground: '4e8872', fontStyle: 'italic' },
 { token: 'keyword', foreground: '34d399' },
 { token: 'string', foreground: 'a7f3d0' },
 { token: 'number', foreground: 'fbbf24' },
 { token: 'type', foreground: '5eead4' }
 ],
 colors: {
 'editor.background': '#0c1c18',
 'editor.foreground': '#e8fff5',
 'editorLineNumber.foreground': '#1a3830',
 'editorLineNumber.activeForeground': '#4e8872',
 'editor.selectionBackground': '#065f46',
 'editor.lineHighlightBackground': '#132a24',
 'editorCursor.foreground': '#10b981',
 'editor.findMatchBackground': '#065f46',
 'editorGutter.background': '#071210',
 'editorWidget.background': '#0c1c18',
 'editorSuggestWidget.background': '#0c1c18',
 'editorSuggestWidget.border': '#1a3830'
 }
 }
}

export default function CodeEditor({
 value,
 language = 'javascript',
 onChange,
 readOnly = false,
 onMount,
 height = '100%'
}) {
 const editorRef = useRef(null)
 const monacoRef = useRef(null)
 const { theme } = useTheme()

 useEffect(() => {
 if (monacoRef.current) {
 monacoRef.current.editor.setTheme(`peercode-${theme}`)
 }
 }, [theme])

 const handleMount = (editor, monaco) => {
 editorRef.current = editor
 monacoRef.current = monaco

 editor.onDidPaste?.(() => {
 setTimeout(() => editor.focus(), 10)
 })

 editor.onKeyDown((e) => {
 if ((e.ctrlKey || e.metaKey) && e.keyCode === 52) {
 e.stopPropagation()
 }
 })

 Object.entries(MONACO_THEMES).forEach(([key, def]) => {
 monaco.editor.defineTheme(`peercode-${key}`, def)
 })
 monaco.editor.setTheme(`peercode-${theme}`)

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
 <div className="flex items-center justify-center h-full bg-bg-base">
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
