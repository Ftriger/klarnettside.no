"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

const ENDPOINT = "/api/beacon"

// Elements that represent the pricing/receipt part of the page.
const PRICING_SELECTOR = "#priser, [data-pricing]"

export function Tracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Never track the internal admin area.
    if (!pathname || pathname.startsWith("/admin")) return

    const vid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const start = Date.now()
    let pricingViewed = false
    let sent = false

    // Watch whether the pricing/receipt section is actually seen.
    let observer: IntersectionObserver | null = null
    const targets = document.querySelectorAll(PRICING_SELECTOR)
    if (targets.length > 0 && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              pricingViewed = true
              observer?.disconnect()
              break
            }
          }
        },
        { threshold: 0.4 },
      )
      targets.forEach((t) => observer!.observe(t))
    }

    const send = () => {
      if (sent) return
      sent = true
      observer?.disconnect()

      const payload = JSON.stringify({
        vid,
        path: pathname,
        referrer: document.referrer || null,
        timeOnPage: Math.round((Date.now() - start) / 1000),
        pricingViewed,
      })

      try {
        // text/plain avoids a CORS preflight for the beacon request.
        const blob = new Blob([payload], { type: "text/plain" })
        if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT, blob)
        } else {
          fetch(ENDPOINT, {
            method: "POST",
            body: payload,
            headers: { "Content-Type": "text/plain" },
            keepalive: true,
          }).catch(() => {})
        }
      } catch {
        // Never let tracking break the page.
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") send()
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", send)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", send)
      observer?.disconnect()
      // Flush on client-side navigation between pages.
      send()
    }
  }, [pathname])

  return null
}
