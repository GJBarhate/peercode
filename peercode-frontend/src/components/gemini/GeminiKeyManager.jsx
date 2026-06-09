import { useState, useCallback } from 'react'
import { Key, CheckCircle2, XCircle, Loader2, ExternalLink, Trash2, ShieldCheck } from 'lucide-react'
import { useGeminiContext } from '../../context/GeminiContext'
import { updateApiKey, validateGeminiKey } from '../../services/api'
import toast from 'react-hot-toast'

export default function GeminiKeyManager() {
  const { userApiKey, setUserApiKey, hasPersonalKey } = useGeminiContext()
  const [inputKey, setInputKey] = useState(userApiKey || '')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)

  const runValidation = useCallback(async (key) => {
    const k = key.trim()
    if (!k) { setValidationResult(null); return }
    setValidating(true)
    setValidationResult(null)
    try {
      await validateGeminiKey(k)
      setValidationResult({ valid: true, message: 'Key is valid' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Key rejected by Google'
      setValidationResult({ valid: false, message: msg })
    } finally {
      setValidating(false)
    }
  }, [])

  const handleBlur = () => {
    runValidation(inputKey)
  }

  const handleSave = async () => {
    const k = inputKey.trim()
    if (!k) { toast.error('Please enter an API key'); return }
    setValidating(true)
    try {
      const res = await validateGeminiKey(k)
      if (res.status !== 200) {
        return
      }
      await updateApiKey(k)
      setUserApiKey(k)
      toast.success('API key saved')
      setValidationResult({ valid: true, message: 'Key is valid' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Key rejected by Google'
      toast.error(msg)
      setValidationResult({ valid: false, message: msg })
    } finally {
      setValidating(false)
    }
  }

  const handleRemove = async () => {
    try {
      await updateApiKey('')
      setUserApiKey(null)
      setInputKey('')
      setValidationResult(null)
      toast.success('API key removed')
    } catch (err) {
      toast.error('Failed to remove API key')
    }
  }

  const showResult = validationResult && inputKey.trim()

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center border border-indigo-200 dark:border-indigo-800/50">
          <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gemini API Key</h3>
          <p className="text-xs text-gray-500">Use your personal key for unlimited AI hints</p>
        </div>
        <div className="ml-auto">
          {hasPersonalKey ? (
            <span className="flex items-center gap-1.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-300 dark:border-green-800/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active - bypassing shared pool
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-300 dark:border-blue-800/50">
              <Key className="w-3.5 h-3.5" />
              Using shared pool (rate limited)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="password"
              value={inputKey}
              onChange={e => { setInputKey(e.target.value); setValidationResult(null) }}
              onBlur={handleBlur}
              placeholder="Enter your Gemini API key"
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              autoComplete="off"
            />
            {validating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {!validating && showResult && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {validationResult.valid
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
                  : <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                }
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={validating || !inputKey.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
          {hasPersonalKey && (
            <button
              onClick={handleRemove}
              disabled={validating}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 transition-colors disabled:opacity-50"
              title="Remove API key"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {showResult && (
          <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
            validationResult.valid
              ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800/30 text-red-700 dark:text-red-400'
          }`}>
            {validationResult.valid ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            )}
            <span>{validationResult.message}</span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs text-gray-500">
        <Key className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 flex-shrink-0 mt-0.5" />
        <div>
          Get a free Gemini API key from{' '}
          <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 inline-flex items-center gap-0.5">
            aistudio.google.com
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          .
        </div>
      </div>
    </div>
  )
}