import { useState, useRef, useEffect } from 'react'
import { Play, Trash2, Code, Terminal } from 'lucide-react'
import Spinner from '../common/Spinner'
import { executeCode, getErrorMessage } from '../../services/api'

export default function ExecutionOutput({ code, language, onClear }) {
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  const [input, setInput] = useState('')
  const terminalRef = useRef(null)

  const handleRunCode = async () => {
    if (!code?.trim()) {
      setError('No code to run')
      return
    }
    setIsRunning(true)
    setError(null)
    setLogs([])

    try {
      const { data } = await executeCode({ code, language, stdin: input })
      if (data?.error) {
        setError(data.error)
      } else {
        const out = (data?.output ?? '').toString()
        setOutput(out)
        setLogs(out ? out.split('\n').filter(Boolean) : [])
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Execution failed'))
    } finally {
      setIsRunning(false)
    }
  }

  const handleClear = () => {
    setOutput('')
    setError(null)
    setLogs([])
    setInput('')
    onClear?.()
  }

  const handlePaste = async (e) => {
    e.preventDefault()
    try {
      const text = await navigator.clipboard.readText()
      setInput(prev => prev + text)
    } catch {
      // paste unavailable — user can type manually
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const handleClearInput = () => {
    setInput('')
  }

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.focus()
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-300">Output</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Spinner size="sm" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run</span>
              </>
            )}
          </button>
          {(output || error || logs.length > 0) && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {!output && !error && logs.length === 0 ? (
          <p className="text-gray-600 text-xs">No output yet. Click "Run" to execute code.</p>
        ) : error ? (
          <div className="text-red-400 bg-red-950/20 p-2 rounded border border-red-700/50">
            <p className="font-semibold text-xs mb-1">❌ Error</p>
            <pre className="text-xs whitespace-pre-wrap break-words">{error}</pre>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300">
                <span className="text-gray-600">{'> '}</span>
                {log}
              </div>
            ))}
            {output && !logs.length && (
              <pre className="text-gray-300 whitespace-pre-wrap break-words">{output}</pre>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Input/Paste</span>
          {input && (
            <button
              onClick={handleClearInput}
              className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
              title="Clear input"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          ref={terminalRef}
          value={input}
          onChange={handleInputChange}
          onPaste={handlePaste}
          placeholder="Click here to paste code or type input..."
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 placeholder-gray-600 resize-none"
          rows={3}
        />
      </div>
    </div>
  )
}
