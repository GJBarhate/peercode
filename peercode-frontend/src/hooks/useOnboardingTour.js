import { useState, useEffect } from 'react'

const TOUR_SEEN_KEY = 'peercode_tour_completed'

export function useOnboardingTour() {
  const [run, setRun] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEY)
    if (!seen) {
      const timer = setTimeout(() => setRun(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const completeTour = () => {
    setRun(false)
    localStorage.setItem(TOUR_SEEN_KEY, '1')
  }

  const resetTour = () => {
    localStorage.removeItem(TOUR_SEEN_KEY)
    setRun(true)
  }

  return { run, completeTour, resetTour }
}

export const dashboardSteps = [
  {
    target: '[data-tour="stat-cards"]',
    content: 'Track your ELO rating, sessions completed, current streak, and average session duration at a glance.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="elo-trend"]',
    content: 'Watch your ELO trend over your last 20 sessions. Keep practicing to see it climb!',
  },
  {
    target: '[data-tour="practice-ctas"]',
    content: 'Choose your practice mode: solve problems solo, pair with a partner, or take an AI mock interview.',
  },
  {
    target: '[data-tour="quick-links"]',
    content: 'Quick access to tracks, mock interviews, your profile, and subscription management.',
  },
]
