import { type NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import {
  type Lead,
  GEO_KEY,
  LEAD_KEY,
  LEADS_INDEX,
  SEEN_KEY,
  isBotOrg,
  isBotUserAgent,
  isResidentialIsp,
  scoreDelta,
} from "@/lib/leads"

export const runtime = "nodejs"

type BeaconBody = {
  vid?: string
  path?: string
  referrer?: string | null
  timeOnPage?: number
  pricingViewed?: boolean
}

type GeoInfo = {
  org: string | null
  isp: string | null
  as: string | null
  city: string | null
  country: string | null
}

const EMPTY_GEO: GeoInfo = {
  org: null,
  isp: null,
  as: null,
  city: null,
  country: null,
}

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  return req.headers.get("x-real-ip")?.trim() || null
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    ip.startsWith("fe80")
  )
}

async function lookupGeo(ip: string): Promise<GeoInfo> {
  // Cached lookups are reused for 30 minutes to stay within ip-api's free limit.
  const cached = await redis.get<GeoInfo>(GEO_KEY(ip))
  if (cached) return cached

  if (isPrivateIp(ip)) {
    await redis.set(GEO_KEY(ip), EMPTY_GEO, { ex: 1800 })
    return EMPTY_GEO
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city,isp,org,as`,
      { signal: AbortSignal.timeout(4000) },
    )
    const data = (await res.json()) as {
      status?: string
      country?: string
      city?: string
      isp?: string
      org?: string
      as?: string
    }
    const geo: GeoInfo =
      data.status === "success"
        ? {
            org: data.org || null,
            isp: data.isp || null,
            as: data.as || null,
            city: data.city || null,
            country: data.country || null,
          }
        : EMPTY_GEO
    await redis.set(GEO_KEY(ip), geo, { ex: 1800 })
    return geo
  } catch {
    // Cache the failure briefly so a bad IP doesn't hammer the API.
    await redis.set(GEO_KEY(ip), EMPTY_GEO, { ex: 300 })
    return EMPTY_GEO
  }
}

export async function POST(req: NextRequest) {
  let body: BeaconBody
  try {
    body = JSON.parse(await req.text()) as BeaconBody
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const path = typeof body.path === "string" ? body.path : "/"
  // Never record admin traffic even if a beacon slips through.
  if (path.startsWith("/admin")) return new NextResponse(null, { status: 204 })

  const ip = getClientIp(req)
  if (!ip) return new NextResponse(null, { status: 204 })

  // Deduplicate repeated beacons from the same page load (e.g. visibilitychange + pagehide).
  if (body.vid) {
    const fresh = await redis.set(SEEN_KEY(body.vid), 1, { nx: true, ex: 120 })
    if (fresh === null) return new NextResponse(null, { status: 204 })
  }

  const ua = req.headers.get("user-agent")
  const timeOnPage = Math.max(0, Math.min(Number(body.timeOnPage) || 0, 3600))
  const pricingViewedNow = body.pricingViewed === true
  const now = Date.now()

  const geo = await lookupGeo(ip)
  const existing = await redis.get<Lead>(LEAD_KEY(ip))

  const bot = isBotUserAgent(ua) || isBotOrg(geo.org, geo.isp, geo.as)
  const residential = isResidentialIsp(geo.org, geo.isp)

  const paths = new Set(existing?.paths ?? [])
  paths.add(path)

  const pricingAlreadyCounted = existing?.pricingViewed ?? false
  const delta = scoreDelta({
    timeOnPage,
    pricingViewedNow,
    pricingAlreadyCounted,
  })

  const lead: Lead = {
    ip,
    org: geo.org,
    isp: geo.isp,
    as: geo.as,
    city: geo.city,
    country: geo.country,
    paths: Array.from(paths).slice(-50),
    pageviews: (existing?.pageviews ?? 0) + 1,
    totalTime: (existing?.totalTime ?? 0) + timeOnPage,
    score: (existing?.score ?? 0) + delta,
    pricingViewed: pricingAlreadyCounted || pricingViewedNow,
    referrer: existing?.referrer ?? (body.referrer || null),
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
    isBot: bot,
    isResidential: residential,
  }

  await redis.set(LEAD_KEY(ip), lead)
  await redis.zadd(LEADS_INDEX, { score: now, member: ip })

  return new NextResponse(null, { status: 204 })
}
