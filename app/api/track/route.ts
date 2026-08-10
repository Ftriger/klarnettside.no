import { NextRequest, NextResponse } from 'next/server'

const KV_URL = process.env.KV_REST_API_URL!
const KV_TOKEN = process.env.KV_REST_API_TOKEN!

async function kv(cmd: (string | number)[]) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  })
  return res.json() as Promise<{ result: any }>
}

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.path) return NextResponse.json({ ok: false }, { status: 400 })

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const ua = req.headers.get('user-agent') || ''
    if (BOT_UA.test(ua)) return NextResponse.json({ ok: true, skipped: 'bot' })

    let org = null, isp = null, city = null, country = null
    if (ip !== 'unknown') {
      const cacheKey = `klarnett:iplookup:${ip}`
      const cached = await kv(['GET', cacheKey])
      if (cached.result) {
        const parsed = JSON.parse(cached.result)
        org = parsed.org; isp = parsed.isp; city = parsed.city; country = parsed.country
      } else {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,org,as`)
          const geo = await geoRes.json()
          if (geo.status === 'success') {
            org = geo.org || null; isp = geo.isp || null; city = geo.city || null; country = geo.country || null
            await kv(['SET', cacheKey, JSON.stringify({ org, isp, city, country }), 'EX', 1800])
          }
        } catch {}
      }
    }

    const visit = {
      ip, org, isp, city, country,
      path: body.path,
      referrer: body.referrer || null,
      timeOnPage: body.timeOnPage || 0,
      ts: Date.now(),
    }

    await kv(['LPUSH', 'klarnett:visits', JSON.stringify(visit)])
    await kv(['LTRIM', 'klarnett:visits', 0, 499])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
