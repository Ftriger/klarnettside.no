"use server"

import { Resend } from "resend"
import {
  createSession,
  destroySession,
  isAuthenticated,
  verifyPassword,
} from "@/lib/admin-auth"

const FROM = "Klarnettside <post@klarnettside.no>"
const OPT_OUT = "Svar STOPP for å reservere deg mot henvendelser"

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

function applyMerge(template: string, bedriftsnavn: string): string {
  return template.replace(/\{\{\s*bedriftsnavn\s*\}\}/g, bedriftsnavn)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function buildHtml(body: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;">${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`)
    .join("")
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#16211d;">
${paragraphs}
<p style="margin:24px 0 0;font-size:12px;color:#5c6660;">${escapeHtml(OPT_OUT)}</p>
</div>`
}

function buildText(body: string): string {
  return `${body}\n\n${OPT_OUT}`
}

export type SendResult = {
  ok: boolean
  id?: string
  error?: string
}

export async function sendOne(input: {
  epost: string
  bedriftsnavn: string
  subject: string
  body: string
}): Promise<SendResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Ikke innlogget." }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY mangler." }
  }

  const epost = input.epost.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost)) {
    return { ok: false, error: "Ugyldig e-postadresse." }
  }

  const subject = applyMerge(input.subject, input.bedriftsnavn).trim()
  const mergedBody = applyMerge(input.body, input.bedriftsnavn)

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: epost,
      subject,
      html: buildHtml(mergedBody),
      text: buildText(mergedBody),
    })
    if (error) {
      return { ok: false, error: error.message ?? "Ukjent feil fra Resend." }
    }
    return { ok: true, id: data?.id }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Uventet feil ved sending.",
    }
  }
}
