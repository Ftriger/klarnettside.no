import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata = { robots: { index: false, follow: false } }

const COOKIE_NAME = 'leads_auth'

async function login(formData: FormData) {
  'use server'
  const password = formData.get('password')
  if (password === process.env.ADMIN_PASSWORD) {
    cookies().set(COOKIE_NAME, String(password), { httpOnly: true, path: '/admin/leads' })
  }
  redirect('/admin/leads')
}

async function getVisits() {
  const KV_URL = process.env.KV_REST_API_URL!
  const KV_TOKEN = process.env.KV_REST_API_TOKEN!
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['LRANGE', 'klarnett:visits', 0, 499]),
    cache: 'no-store',
  })
  const data = await res.json()
  return (data.result || []).map((s: string) => JSON.parse(s))
}

const RESIDENTIAL = ['telenor', 'altibox', 'get ', 'telia', 'lyse', 'nextgentel', 'ice.net', 'homerun']
function isResidential(org?: string, isp?: string) {
  const s = `${org || ''} ${isp || ''}`.toLowerCase()
  return RESIDENTIAL.some((r) => s.includes(r))
}

export default async function LeadsPage({ searchParams }: { searchParams: { visAlle?: string } }) {
  const authed = cookies().get(COOKIE_NAME)?.value === process.env.ADMIN_PASSWORD

  if (!authed) {
    return (
      <div style={{ maxWidth: 320, margin: '80px auto', fontFamily: 'monospace' }}>
        <form action={login}>
          <p>Logg inn</p>
          <input type="password" name="password" placeholder="Passord" style={{ width: '100%', padding: 8, marginBottom: 8 }} />
          <button type="submit" style={{ width: '100%', padding: 8 }}>Logg inn</button>
        </form>
      </div>
    )
  }

  const visits = await getVisits()
  const showAll = searchParams?.visAlle === '1'

  const byIp: Record<string, any> = {}
  for (const v of visits) {
    if (!byIp[v.ip]) byIp[v.ip] = { ip: v.ip, org: v.org, isp: v.isp, city: v.city, country: v.country, pages: new Set(), totalTime: 0, lastSeen: v.ts, score: 0 }
    const e = byIp[v.ip]
    e.pages.add(v.path)
    e.totalTime += v.timeOnPage || 0
    e.lastSeen = Math.max(e.lastSeen, v.ts)
    e.score += 1
    if ((v.timeOnPage || 0) > 30) e.score += 2
  }

  let leads = Object.values(byIp).map((e: any) => ({ ...e, pages: e.pages.size }))
  if (!showAll) leads = leads.filter((l: any) => !isResidential(l.org, l.isp))
  leads.sort((a: any, b: any) => b.score - a.score)

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'monospace', padding: 16 }}>
      <h1>Besøkende / leads</h1>
      <p><a href={showAll ? '/admin/leads' : '/admin/leads?visAlle=1'}>{showAll ? 'Skjul ISP/roboter' : 'Vis alle (inkl. ISP/roboter)'}</a></p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Organisasjon</th><th>By</th><th>Sider</th><th>Total tid (s)</th><th>Poeng</th><th>Siste besøk</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l: any) => (
            <tr key={l.ip} style={{ borderBottom: '1px solid #eee' }}>
              <td>{l.org || l.isp || l.ip}</td>
              <td>{l.city}, {l.country}</td>
              <td>{l.pages}</td>
              <td>{Math.round(l.totalTime)}</td>
              <td>{l.score}{l.score >= 8 ? ' 🔥' : ''}</td>
              <td>{new Date(l.lastSeen).toLocaleString('no-NO')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
