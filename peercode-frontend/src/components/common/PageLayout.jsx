import Navbar from './Navbar'

export default function PageLayout({ children, className = '' }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 ${className}`}>
        {children}
      </main>
    </div>
  )
}
