import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import MatchingQueue from '../components/room/MatchingQueue'

export default function MatchPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Helmet>
        <title>Find a Partner | PeerCode</title>
        <meta name="description" content="Match with a coding partner for practice sessions" />
      </Helmet>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Find a Partner</h1>
          <p className="text-gray-500">Get instantly matched with another developer for a practice session</p>
        </div>
        <MatchingQueue />
      </main>
    </div>
  )
}