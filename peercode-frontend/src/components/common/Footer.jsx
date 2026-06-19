import { Link } from 'react-router-dom'
import { Code2 } from 'lucide-react'

const LINKS = {
  Product: [
    { label: 'Problems', to: '/problems' },
    { label: 'Tracks', to: '/tracks' },
    { label: 'AI Interview', to: '/ai-interview' },
    { label: 'Find Partner', to: '/find-partner' },
  ],
  Resources: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Profile', to: '/profile' },
    { label: 'Subscription', to: '/subscription' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-gray-950/80 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-100">PeerCode</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Practice technical interviews with peers in real-time. Master DSA, ace your next interview.
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{section}</h3>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} PeerCode. Made with ♥ for coders.
          </p>
          <p className="text-xs text-gray-700">
            Built for engineers, by engineers.
          </p>
        </div>
      </div>
    </footer>
  )
}
