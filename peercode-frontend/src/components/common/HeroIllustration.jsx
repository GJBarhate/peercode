export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 320" className="w-full max-w-md mx-auto" fill="none">
      <rect x="60" y="100" width="280" height="160" rx="12" className="fill-gray-800 stroke-gray-700" strokeWidth="2" />
      <rect x="60" y="100" width="280" height="28" rx="12" className="fill-gray-800" />
      <rect x="60" y="114" width="280" height="14" className="fill-gray-800" />
      <circle cx="80" cy="114" r="5" className="fill-red-500" />
      <circle cx="92" cy="114" r="5" className="fill-amber-500" />
      <circle cx="104" cy="114" r="5" className="fill-green-500" />

      <rect x="80" y="145" width="100" height="8" rx="4" className="fill-indigo-500/60" />
      <rect x="80" y="160" width="160" height="6" rx="3" className="fill-gray-600" />
      <rect x="80" y="172" width="140" height="6" rx="3" className="fill-gray-600" />
      <rect x="80" y="184" width="120" height="6" rx="3" className="fill-gray-600" />
      <rect x="80" y="196" width="150" height="6" rx="3" className="fill-gray-600" />

      <circle cx="310" cy="155" r="6" className="fill-green-500" />
      <path d="M307 155h6M310 152v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

      <rect x="210" y="215" width="120" height="28" rx="6" className="fill-indigo-600/40" />
      <text x="270" y="233" textAnchor="middle" fontSize="11" className="fill-indigo-300">Running tests...</text>

      <circle cx="130" cy="270" r="14" className="fill-gray-700 stroke-gray-600" strokeWidth="1.5" />
      <path d="M130 262v3M130 273v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="fill-gray-400" />
      <path d="M118 266l12-4 12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="fill-gray-500" />

      <circle cx="270" cy="270" r="14" className="fill-gray-700 stroke-gray-600" strokeWidth="1.5" />
      <path d="M270 262v3M270 273v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="fill-gray-400" />
      <path d="M258 266l12-4 12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="fill-gray-500" />

      <line x1="145" y1="270" x2="255" y2="270" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" className="stroke-gray-600" />
    </svg>
  )
}
