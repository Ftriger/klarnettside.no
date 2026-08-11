import type { Metadata } from "next"
import { isAuthenticated } from "@/lib/admin-auth"
import { LoginForm } from "./login-form"
import { Sender } from "./sender"

export const metadata: Metadata = {
  title: "Utsending",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function UtsendingPage() {
  const authed = await isAuthenticated()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-5 py-12 md:py-16">
        <header className="mb-10">
          <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
            Klarnettside · Internt
          </p>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-balance md:text-4xl">
            E-postutsending
          </h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Lim inn en leadliste, skriv en mal og send personaliserte e-poster
            én om gangen med rolig tempo.
          </p>
        </header>

        {authed ? <Sender /> : <LoginForm />}
      </div>
    </main>
  )
}
