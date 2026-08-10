'use client'
import { useEffect } from 'react'

export default function LeadTracker() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return
    const start = Date.now()
    const send = () => {
      const payload = JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer,
        timeOnPage: Math.round((Date.now() - start) / 1000),
      })
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'text/plain' }))
    }
    window.addEventListener('beforeunload', send)
    window.addEventListener('pagehide', send)
    return () => {
      window.removeEventListener('beforeunload', send)
      window.removeEventListener('pagehide', send)
    }
  }, [])
  return null
}
