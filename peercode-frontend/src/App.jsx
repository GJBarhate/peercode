import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ConnectionBanner from './components/common/ConnectionBanner'
import ErrorBoundary from './components/common/ErrorBoundary'
import Spinner from './components/common/Spinner'

const HomePage = lazy(() => import('./pages/HomePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const RoomPage = lazy(() => import('./pages/RoomPage'))
const ProblemsPage = lazy(() => import('./pages/ProblemsPage'))
const ProblemDetailPage = lazy(() => import('./pages/ProblemDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PlaybackPage = lazy(() => import('./pages/PlaybackPage'))
const DebriefPage = lazy(() => import('./pages/DebriefPage'))
const TracksPage = lazy(() => import('./pages/TracksPage'))
const TrackDetailPage = lazy(() => import('./pages/TrackDetailPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const MatchPage = lazy(() => import('./pages/MatchPage'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function E({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[data-modal]')
        const last = modals[modals.length - 1]
        if (last) { last.dispatchEvent(new Event('close')); return }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const search = document.querySelector('[data-search-input]')
        if (search) { search.focus(); return }
        navigate('/problems')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <>
      <ConnectionBanner />
      <Suspense fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <Spinner size="xl" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<E><HomePage /></E>} />
          <Route path="/problems" element={<E><ProblemsPage /></E>} />
          <Route path="/problems/:slug" element={<E><ProblemDetailPage /></E>} />
          <Route path="/tracks" element={<E><TracksPage /></E>} />
          <Route path="/tracks/:slug" element={<E><TrackDetailPage /></E>} />

          <Route path="/dashboard" element={
            <ProtectedRoute><E><DashboardPage /></E></ProtectedRoute>
          } />
          <Route path="/room/:roomId" element={
            <ProtectedRoute>
              <E><RoomPage /></E>
            </ProtectedRoute>
          } />
          <Route path="/playback/:roomId" element={
            <ProtectedRoute><E><PlaybackPage /></E></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><E><ProfilePage /></E></ProtectedRoute>
          } />
          <Route path="/debrief/:roomId" element={
            <ProtectedRoute><E><DebriefPage /></E></ProtectedRoute>
          } />
          <Route path="/match" element={
            <ProtectedRoute><E><MatchPage /></E></ProtectedRoute>
          } />
          <Route path="/find-partner" element={
            <ProtectedRoute><E><MatchPage /></E></ProtectedRoute>
          } />
          <Route path="/subscription" element={
            <ProtectedRoute><E><SubscriptionPage /></E></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><E><AdminPage /></E></AdminRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
