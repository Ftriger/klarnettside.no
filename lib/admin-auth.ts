import "server-only"
import { createHash, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "klar_admin_session"

function sessionToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? ""
  // The cookie stores a hash of the password, so it cannot be forged
  // without knowing ADMIN_PASSWORD, and the password itself never leaves the server.
  return createHash("sha256").update(`klarnettside:${password}`).digest("hex")
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ""
  if (!expected) return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const value = store.get(COOKIE_NAME)?.value
  if (!value) return false
  const expected = sessionToken()
  const a = Buffer.from(value)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function createSession(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
