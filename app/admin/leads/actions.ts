"use server"

import {
  createSession,
  destroySession,
  isAuthenticated,
  verifyPassword,
} from "@/lib/admin-auth"
import { redis } from "@/lib/redis"
import { type Lead, LEADS_INDEX, LEAD_KEY } from "@/lib/leads"

export async function login(_prev: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "")
  if (!verifyPassword(password)) {
    return { ok: false, error: "Feil passord." }
  }
  await createSession()
  return { ok: true, error: null }
}

export async function logout() {
  await destroySession()
}

export async function fetchLeads(): Promise<Lead[]> {
  if (!(await isAuthenticated())) return []

  // Most recent 300 IPs by last-seen timestamp.
  const ips = await redis.zrange<string[]>(LEADS_INDEX, 0, 299, { rev: true })
  if (!ips || ips.length === 0) return []

  const keys = ips.map((ip) => LEAD_KEY(ip))
  const leads = await redis.mget<Lead[]>(...keys)

  return leads
    .filter((l): l is Lead => Boolean(l))
    .sort((a, b) => b.score - a.score || b.lastSeen - a.lastSeen)
}
