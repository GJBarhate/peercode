import { useState, useCallback } from 'react'
import { getHint, analyzeCode, generateQuestion } from '../services/api'
import toast from 'react-hot-toast'

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
      return data.hint
    } catch (err) {
      console.error('Hint error:', err)
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
      return data
    } catch (err) {
      console.error('Analysis error:', err)
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to analyze code'
      toast.error(msg)
      return null
    } finally {
      setIsLoadingAnalysis(false)
    }
  }, [])

  const fetchQuestion = useCallback(async ({ topic, difficulty }) => {
    try {
      const { data } = await generateQuestion({ topic, difficulty })
      return data
    } catch (err) {
      console.error('Generate question error:', err)
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to generate question'
      toast.error(msg)
      return null
    }
  }, [])

  return { isLoadingHint, isLoadingAnalysis, hint, analysis, fetchHint, fetchAnalysis, fetchQuestion }
}
