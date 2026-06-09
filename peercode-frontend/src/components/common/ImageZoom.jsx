import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

export default function ImageZoom({ src, alt, className, children, ...props }) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <>
      <div className="cursor-pointer inline-block" onClick={() => setOpen(true)}>
        {children || <img src={src} alt={alt} className={className} {...props} />}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            aria-label="Close zoom"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] object-contain animate-scale-in"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
