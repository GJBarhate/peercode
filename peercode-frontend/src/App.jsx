import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ConnectionBanner from './components/common/ConnectionBanner'
import ErrorBoundary from './components/common/ErrorBoundary'
import Spinner from './components/common/Spinner'
import BackToTop from './components/common/BackToTop'
import PageTransition from './components/common/PageTransition'
import CommandPalette from './components/common/CommandPalette'
import CustomCursor from './components/common/CustomCursor'
import Sidebar from './components/common/Sidebar'

const NO_CHROME_PATHS = new Set(['/', '/auth/callback'])
const isLiveRoomPath = (pathname) => /^\/room\/[^/]+$/.test(pathname)
const isProblemWorkspacePath = (pathname) => /^\/problems\/[^/]+$/.test(pathname)

const HomePage = lazy(() => import('./pages/HomePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
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
const AIInterviewPage = lazy(() => import('./pages/AIInterviewPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const PrivateRoomPage = lazy(() => import('./pages/PrivateRoomPage'))
const ContestsPage = lazy(() => import('./pages/ContestsPage'))
const ContestDetailPage = lazy(() => import('./pages/ContestDetailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function ProtectedRoute({ children }) {
 const { user, isLoading } = useAuth()
 
 if (isLoading) {
 return (
 <div className="min-h-screen bg-bg-base flex items-center justify-center">
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
 <div className="min-h-screen bg-bg-base flex items-center justify-center">
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
 const location = useLocation()
 const [cmdOpen, setCmdOpen] = useState(false)
 const showChrome = !NO_CHROME_PATHS.has(location.pathname) && !isLiveRoomPath(location.pathname) && !isProblemWorkspacePath(location.pathname)

 useEffect(() => {
 const onKey = (e) => {
 if (e.key === 'Escape') {
 if (cmdOpen) { setCmdOpen(false); return }
 const modals = document.querySelectorAll('[data-modal]')
 const last = modals[modals.length - 1]
 if (last) { last.dispatchEvent(new Event('close')); return }
 }
 if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
 e.preventDefault()
 setCmdOpen(v => !v)
 }
 }
 window.addEventListener('keydown', onKey)
 return () => window.removeEventListener('keydown', onKey)
 }, [cmdOpen])

 return (
 <>
 <ConnectionBanner />
 {showChrome && <Sidebar />}
 <div className={showChrome ? 'app-shell-main' : ''}>
 <Suspense fallback={
 <div className="min-h-screen bg-bg-base flex items-center justify-center">
 <Spinner size="xl" />
 </div>
 }>
 <Routes>
 <Route path="/" element={<PageTransition><E><HomePage /></E></PageTransition>} />
 <Route path="/auth/callback" element={<E><AuthCallbackPage /></E>} />
 <Route path="/problems" element={<PageTransition><E><ProblemsPage /></E></PageTransition>} />
 <Route path="/problems/:slug" element={<PageTransition><E><ProblemDetailPage /></E></PageTransition>} />
 <Route path="/tracks" element={<PageTransition><E><TracksPage /></E></PageTransition>} />
 <Route path="/tracks/:slug" element={<PageTransition><E><TrackDetailPage /></E></PageTransition>} />

 <Route path="/dashboard" element={
 <ProtectedRoute><PageTransition><E><DashboardPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/room/:roomId" element={
 <ProtectedRoute><E><RoomPage /></E></ProtectedRoute>
 } />
 <Route path="/playback/:roomId" element={
 <ProtectedRoute><PageTransition><E><PlaybackPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/profile" element={
 <ProtectedRoute><PageTransition><E><ProfilePage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/debrief/:roomId" element={
 <ProtectedRoute><PageTransition><E><DebriefPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/match" element={
 <ProtectedRoute><PageTransition><E><MatchPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/find-partner" element={<Navigate to="/match" replace />} />
 <Route path="/subscription" element={
 <ProtectedRoute><PageTransition><E><SubscriptionPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/ai-interview" element={
 <ProtectedRoute><PageTransition><E><AIInterviewPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/leaderboard" element={
 <PageTransition><E><LeaderboardPage /></E></PageTransition>
 } />
 <Route path="/contests" element={
 <ProtectedRoute><PageTransition><E><ContestsPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/contests/:slug" element={
 <ProtectedRoute><PageTransition><E><ContestDetailPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/private-room" element={
 <ProtectedRoute><PageTransition><E><PrivateRoomPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/room/join/:inviteCode" element={
 <ProtectedRoute><PageTransition><E><PrivateRoomPage /></E></PageTransition></ProtectedRoute>
 } />
 <Route path="/admin" element={
 <AdminRoute><PageTransition><E><AdminPage /></E></PageTransition></AdminRoute>
 } />

 <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
 </Routes>
 </Suspense>
 </div>
 <BackToTop />
 <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
 <CustomCursor />
 </>
 )
}
