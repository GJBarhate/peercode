import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Trophy, Wifi, WifiOff } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import Navbar from '../components/common/Navbar'
import { LeaderboardRow } from '../components/leaderboard/LeaderboardRow'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/common/Spinner'

const TABS = ['All Time', 'Weekly', 'Monthly']

export default function LeaderboardPage() {
  const { user } = useAuth()
  const { rows, connected } = useLeaderboard()
  const [activeTab, setActiveTab] = useState('All Time')

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Helmet>
        <title>Leaderboard | PeerCode</title>
        <meta name="description" content="Live ELO rankings of the top competitive coders on PeerCode." />
      </Helmet>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-100">Leaderboard</h1>
              <p className="text-sm text-gray-500">Top 100 by ELO rating</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${connected ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-gray-500 border-gray-700 bg-gray-800/50'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {rows.map(row => (
                <LeaderboardRow
                  key={row.username}
                  row={row}
                  isCurrentUser={row.username === user?.username}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
