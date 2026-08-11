"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { fetchLeads, logout } from "./actions"
import type { Lead } from "@/lib/leads"

const WARM_THRESHOLD = 8

function displayOrg(lead: Lead): string {
  return lead.org || lead.isp || lead.as || "Ukjent organisasjon"
}

function isNoise(lead: Lead): boolean {
  return lead.isBot || lead.isResidential
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}m ${s}s` : `${m}m`
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60000)
  if (min < 1) return "nå nettopp"
  if (min < 60) return `${min} min siden`
  const hrs = Math.round(min / 60)
  if (hrs < 24) return `${hrs} t siden`
  const days = Math.round(hrs / 24)
  return `${days} d siden`
}

export function Dashboard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [hideNoise, setHideNoise] = useState(true)
  const [pending, startTransition] = useTransition()

  const visible = useMemo(
    () => (hideNoise ? leads.filter((l) => !isNoise(l)) : leads),
    [leads, hideNoise],
  )

  const warmCount = useMemo(
    () => visible.filter((l) => l.score >= WARM_THRESHOLD).length,
    [visible],
  )

  const refresh = () => {
    startTransition(async () => {
      const next = await fetchLeads()
      setLeads(next)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={hideNoise}
              onChange={(e) => setHideNoise(e.target.checked)}
              className="h-4 w-4 accent-[var(--teal)]"
            />
            Skjul ISP / roboter
          </label>
          <span className="font-mono text-xs text-muted-foreground">
            {visible.length} lead{visible.length === 1 ? "" : "s"}
            {warmCount > 0 ? ` · ${warmCount} varme` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={pending}
          >
            {pending ? "Oppdaterer…" : "Oppdater"}
          </Button>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Logg ut
            </Button>
          </form>
        </div>
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-serif text-lg text-ink">Ingen leads ennå</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {leads.length > 0
              ? "Alle besøk er filtrert bort som ISP/roboter. Slå av filteret for å se dem."
              : "Besøk på nettsiden dukker opp her etter hvert som de skjer."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Organisasjon</th>
                <th className="px-4 py-3 text-right font-medium">Sider</th>
                <th className="px-4 py-3 text-right font-medium">Total tid</th>
                <th className="px-4 py-3 text-right font-medium">Poeng</th>
                <th className="px-4 py-3 font-medium">Siste besøk</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((lead) => {
                const warm = lead.score >= WARM_THRESHOLD
                return (
                  <tr
                    key={lead.ip}
                    className="border-b border-border last:border-0 align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">
                          {displayOrg(lead)}
                        </span>
                        {warm ? (
                          <span className="rounded-full bg-teal px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary-foreground">
                            Varmt lead
                          </span>
                        ) : null}
                        {isNoise(lead) ? (
                          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                            {lead.isBot ? "Robot" : "ISP"}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {[lead.city, lead.country].filter(Boolean).join(", ") ||
                          lead.ip}
                        {lead.pricingViewed ? " · så priser" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                      {lead.paths.length}
                      <span className="text-muted-foreground">
                        {" "}
                        / {lead.pageviews}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                      {formatDuration(lead.totalTime)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          warm
                            ? "font-mono text-base font-semibold tabular-nums text-teal"
                            : "font-mono text-base tabular-nums text-foreground"
                        }
                      >
                        {lead.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {formatRelative(lead.lastSeen)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
