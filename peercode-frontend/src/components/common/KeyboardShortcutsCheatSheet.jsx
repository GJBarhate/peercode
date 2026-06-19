import { useState, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'

export default function KeyboardShortcutsCheatSheet() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey &&
          !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        setIsOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const shortcuts = [
    { keys: ['Ctrl', 'Enter'], action: 'Run tests' },
    { keys: ['Ctrl', 'S'], action: 'Save code (auto)' },
    { keys: ['Space'], action: 'Start/pause timer' },
    { keys: ['Esc'], action: 'Close modals' },
    { keys: ['Tab'], action: 'Navigate elements' },
    { keys: ['?'], action: 'Show this menu' }
  ]

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (press ?)"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-labelledby="shortcuts-title"
          aria-modal="true"
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="shortcuts-title" className="text-xl font-bold text-gray-100">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                aria-label="Close shortcuts"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <span className="text-sm text-gray-400">{shortcut.action}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i} className="text-xs bg-gray-900 border border-gray-600 rounded px-2 py-1 text-gray-300 font-mono">
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
