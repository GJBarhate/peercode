import { useState, useCallback } from 'react'
import { getHint, analyzeCode } from '../services/api'
import toast from 'react-hot-toast'

function notifyKeyFallback(data) {
  if (!data?.usedFallback) return
  const reasonText = data.fallbackReason === 'quota_exceeded'
    ? "Your Gemini API key's quota is exceeded"
    : 'Your Gemini API key is invalid'
  toast(`${reasonText} — switched to PeerCode's shared key for this request.`, { icon: '⚠️' })
}

export function useGemini() {
 const [isLoadingHint, setIsLoadingHint] = useState(false)
 const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
 const [hint, setHint] = useState(null)
 const [analysis, setAnalysis] = useState(null)

 const fetchHint = useCallback(async ({ code, problemDescription, language }) => {
 if (!problemDescription) {
 toast.error('Problem description is required to get a hint')
 return null
 }
 setIsLoadingHint(true)
 setHint(null)
 try {
 const { data } = await getHint({
 code: code || '',
 problem: problemDescription,
 language
 })
 setHint(data.hint)
 notifyKeyFallback(data)
 return data.hint
 } catch (err) {
 // hint error handled via toast
 const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to get hint'
 toast.error(msg)
 return null
 } finally {
 setIsLoadingHint(false)
 }
 }, [])

 const fetchAnalysis = useCallback(async ({ code, language, problemDescription }) => {
 if (!code || !code.trim()) {
 toast.error('Please write some code to analyze')
 return null
 }
 if (!problemDescription) {
 toast.error('Problem description is required for analysis')
 return null
 }
 setIsLoadingAnalysis(true)
 setAnalysis(null)
 try {
 const { data } = await analyzeCode({
 code,
 language,
 problem: problemDescription
 })
 setAnalysis(data)
 notifyKeyFallback(data)
 return data
 } catch (err) {
 // analysis error handled via toast
 const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to analyze code'
 toast.error(msg)
 return null
 } finally {
 setIsLoadingAnalysis(false)
 }
 }, [])

 return { isLoadingHint, isLoadingAnalysis, hint, analysis, fetchHint, fetchAnalysis }
}
