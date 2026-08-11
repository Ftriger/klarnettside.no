"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { login } from "./actions"
import { Button } from "@/components/ui/button"

export function LoginForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(login, {
    ok: false,
    error: null as string | null,
  })

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state.ok, router])

  return (
    <div className="max-w-sm rounded-xl border border-border bg-card p-6">
      <h2 className="font-serif text-lg font-medium">Logg inn</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Skriv inn administratorpassordet for å fortsette.
      </p>
      <form action={formAction} className="mt-5 flex flex-col gap-3">
        <label htmlFor="password" className="sr-only">
          Passord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Passord"
        />
        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Sjekker…" : "Logg inn"}
        </Button>
      </form>
    </div>
  )
}
