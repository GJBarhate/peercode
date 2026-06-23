export default function CursorLabel({ username, color = '#818cf8', style = {} }) {
 return (
 <div
 className="pointer-events-none absolute flex items-center gap-1"
 style={{ zIndex: 100, ...style }}
 >
 <div
 className="px-2 py-0.5 rounded text-xs font-semibold text-white whitespace-nowrap"
 style={{ backgroundColor: color }}
 >
 {username}
 </div>
 <div
 className="w-0.5 h-4 rounded"
 style={{ backgroundColor: color }}
 />
 </div>
 )
}
