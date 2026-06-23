import { useState, useCallback } from 'react'

const KEY = 'peercode_bookmarks'

function load() {
 try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function useBookmarks() {
 const [bookmarks, setBookmarks] = useState(() => new Set(load()))

 const toggle = useCallback((slug) => {
 setBookmarks(prev => {
 const next = new Set(prev)
 if (next.has(slug)) next.delete(slug)
 else next.add(slug)
 localStorage.setItem(KEY, JSON.stringify([...next]))
 return next
 })
 }, [])

 const isBookmarked = useCallback((slug) => bookmarks.has(slug), [bookmarks])

 return { bookmarks, toggle, isBookmarked }
}
