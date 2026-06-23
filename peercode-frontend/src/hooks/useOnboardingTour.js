import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const TOUR_PREFIX = 'peercode_tour_'

export function useOnboardingTour(pageKey = 'dashboard') {
 const { user } = useAuth()
 const userId = user?._id || user?.id || ''
 const storageKey = userId ? `${TOUR_PREFIX}${userId}_${pageKey}` : `${TOUR_PREFIX}${pageKey}`
 const [run, setRun] = useState(false)

 useEffect(() => {
 if (!userId) return
 const seen = localStorage.getItem(storageKey)
 if (!seen) {
 const timer = setTimeout(() => setRun(true), 1200)
 return () => clearTimeout(timer)
 }
 }, [storageKey, userId])

 const completeTour = useCallback(() => {
 setRun(false)
 localStorage.setItem(storageKey, '1')
 }, [storageKey])

 const resetTour = useCallback(() => {
 localStorage.removeItem(storageKey)
 setRun(true)
 }, [storageKey])

 return { run, completeTour, resetTour }
}

const beacon = { disableBeacon: true }

export const dashboardSteps = [
 {
 target: '[data-tour="practice-ctas"]',
 content: 'Choose your practice mode: solve problems solo, pair with a partner, or take an AI mock interview.',
 ...beacon,
 },
 {
 target: '[data-tour="stat-cards"]',
 content: 'Track your ELO rating, sessions completed, current streak, and average session duration at a glance.',
 ...beacon,
 },
 {
 target: '[data-tour="elo-trend"]',
 content: 'Watch your ELO trend over your last 20 sessions. Keep practicing to see it climb!',
 ...beacon,
 },
 {
 target: '[data-tour="quick-links"]',
 content: 'Quick access to tracks, contests, mock interviews, your profile, and more.',
 ...beacon,
 },
]

export const problemsSteps = [
 {
 target: '[data-tour="problems-filters"]',
 content: 'Filter problems by difficulty, topic, or search by name. Find the perfect challenge for your level.',
 ...beacon,
 },
 {
 target: '[data-tour="problems-list"]',
 content: 'Browse 20+ curated coding problems. Click any problem to start solving with the built-in editor.',
 ...beacon,
 },
]

export const contestsSteps = [
 {
 target: '[data-tour="contests-upcoming"]',
 content: 'See upcoming contests with countdown timers. Join before they start to compete for rankings!',
 ...beacon,
 },
 {
 target: '[data-tour="contests-history"]',
 content: 'Review your past contest results, scores, and ranking history.',
 ...beacon,
 },
]

export const interviewSteps = [
 {
 target: '[data-tour="interview-setup"]',
 content: 'Configure your mock interview: choose a company, difficulty, and optionally upload your resume for tailored questions.',
 ...beacon,
 },
]

export const profileSteps = [
 {
 target: '[data-tour="profile-stats"]',
 content: 'View your complete stats — ELO rating, total sessions, badges earned, and streak history.',
 ...beacon,
 },
 {
 target: '[data-tour="profile-badges"]',
 content: 'Collect badges by maintaining streaks, completing contests, and hitting milestones.',
 ...beacon,
 },
]

export const leaderboardSteps = [
 {
 target: '[data-tour="leaderboard-table"]',
 content: 'See how you rank against other PeerCode users. Climb the leaderboard by winning contests and coding sessions!',
 ...beacon,
 },
]
