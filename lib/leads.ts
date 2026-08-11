import "server-only"

export type Lead = {
  ip: string
  org: string | null
  isp: string | null
  as: string | null
  city: string | null
  country: string | null
  paths: string[]
  pageviews: number
  totalTime: number // seconds
  score: number
  pricingViewed: boolean
  referrer: string | null
  firstSeen: number
  lastSeen: number
  isBot: boolean
  isResidential: boolean
}

// Redis keys
export const LEAD_KEY = (ip: string) => `lead:${ip}`
export const GEO_KEY = (ip: string) => `geo:${ip}`
export const SEEN_KEY = (vid: string) => `beacon:seen:${vid}`
export const LEADS_INDEX = "leads:index"

export const WARM_LEAD_THRESHOLD = 8

// --- Classification -------------------------------------------------------

const BOT_UA = [
  "bot",
  "crawler",
  "spider",
  "crawl",
  "slurp",
  "mediapartners",
  "facebookexternalhit",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "pinterest",
  "developers.google.com",
  "google-inspectiontool",
  "gptbot",
  "oai-searchbot",
  "chatgpt-user",
  "ccbot",
  "anthropic",
  "claudebot",
  "perplexitybot",
  "bytespider",
  "amazonbot",
  "applebot",
  "semrushbot",
  "ahrefsbot",
  "dotbot",
  "mj12bot",
  "petalbot",
  "yandexbot",
  "bingbot",
  "googlebot",
  "duckduckbot",
  "baiduspider",
  "headlesschrome",
  "python-requests",
  "axios",
  "curl",
  "wget",
  "go-http-client",
  "node-fetch",
  "lighthouse",
]

// Cloud/hosting orgs are also treated as non-human noise for the default view.
const BOT_ORG = [
  "google",
  "googlebot",
  "microsoft",
  "amazon",
  "amazon technologies",
  "amazon.com",
  "aws",
  "digitalocean",
  "hetzner",
  "ovh",
  "linode",
  "vercel",
  "cloudflare",
  "fastly",
  "akamai",
  "facebook",
  "meta platforms",
  "censys",
  "shodan",
  "palo alto",
  "datacamp",
]

// Norwegian consumer / residential ISPs — mostly private lines, low B2B value.
const RESIDENTIAL_ISP = [
  "telenor",
  "altibox",
  "get as",
  "get norway",
  "telia",
  "netcom",
  "lyse",
  "nextgentel",
  "ice",
  "ice communication",
  "homenet",
  "eidsiva",
  "globalconnect",
  "canal digital",
  "onecall",
  "chilimobil",
  "talkmore",
]

function matchesAny(haystack: string | null | undefined, needles: string[]): boolean {
  if (!haystack) return false
  const s = haystack.toLowerCase()
  return needles.some((n) => s.includes(n))
}

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true // no UA at all is almost always automated traffic
  return matchesAny(ua, BOT_UA)
}

export function isBotOrg(org: string | null, isp: string | null, asName: string | null): boolean {
  return (
    matchesAny(org, BOT_ORG) ||
    matchesAny(isp, BOT_ORG) ||
    matchesAny(asName, BOT_ORG)
  )
}

export function isResidentialIsp(org: string | null, isp: string | null): boolean {
  return matchesAny(org, RESIDENTIAL_ISP) || matchesAny(isp, RESIDENTIAL_ISP)
}

// --- Scoring --------------------------------------------------------------

/**
 * Score increment for a single pageview event.
 * +1 per page visited by the same IP
 * +2 if time-on-page > 30s
 * +5 the first time the pricing/receipt section is viewed
 */
export function scoreDelta(opts: {
  timeOnPage: number
  pricingViewedNow: boolean
  pricingAlreadyCounted: boolean
}): number {
  let delta = 1
  if (opts.timeOnPage > 30) delta += 2
  if (opts.pricingViewedNow && !opts.pricingAlreadyCounted) delta += 5
  return delta
}

export function isWarmLead(lead: Pick<Lead, "score">): boolean {
  return lead.score >= WARM_LEAD_THRESHOLD
}

/** A lead is hidden from the default view if it looks like a bot or a residential line. */
export function isNoise(lead: Pick<Lead, "isBot" | "isResidential">): boolean {
  return lead.isBot || lead.isResidential
}

export function displayOrg(lead: Lead): string {
  return lead.org || lead.isp || lead.as || "Ukjent organisasjon"
}
