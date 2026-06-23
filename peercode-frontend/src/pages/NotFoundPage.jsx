import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
 return (
 <div className="min-h-screen bg-bg-base flex items-center justify-center">
 <Helmet>
 <title>Page Not Found | PeerCode</title>
 <meta name="description" content="The page you're looking for doesn't exist" />
 </Helmet>
 <div className="text-center px-4">
 <div className="text-9xl font-black text-indigo-500/20 select-none mb-4">404</div>
 <h1 className="text-3xl font-bold text-text-primary mb-3">Page not found</h1>
 <p className="text-text-muted mb-8 max-w-md">
 The page you're looking for doesn't exist or has been moved.
 </p>
 <Link
 to="/"
 className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
 >
 <Home className="w-4 h-4" />
 Back to Home
 </Link>
 </div>
 </div>
 )
}
