"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { logout, sendOne } from "./actions"
import { Button } from "@/components/ui/button"

type Lead = { bedriftsnavn: string; epost: string }
type Status = "pending" | "sending" | "sent" | "failed"
type Row = Lead & { status: Status; detail?: string }

const OPT_OUT = "Svar STOPP for å reservere deg mot henvendelser"

function detectDelimiter(line: string): string {
  if (line.includes("\t")) return "\t"
  if (line.includes(";")) return ";"
  return ","
}

function splitLine(line: string, delimiter: string): string[] {
  // Minimal CSV handling with quoted-field support.
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseLeads(raw: string): Lead[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines[0])
  const firstCells = splitLine(lines[0], delimiter).map((c) => c.toLowerCase())

  let nameIdx = 0
  let emailIdx = 1
  let startRow = 0

  const hasHeader =
    firstCells.some((c) => c.includes("bedrift") || c.includes("navn")) &&
    firstCells.some((c) => c.includes("epost") || c.includes("e-post") || c.includes("mail"))

  if (hasHeader) {
    nameIdx = firstCells.findIndex((c) => c.includes("bedrift") || c.includes("navn"))
    emailIdx = firstCells.findIndex(
      (c) => c.includes("epost") || c.includes("e-post") || c.includes("mail"),
    )
    startRow = 1
  }

  const leads: Lead[] = []
  const seen = new Set<string>()
  for (let i = startRow; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter)
    let epost = ""
    let bedriftsnavn = ""

    if (hasHeader) {
      epost = cells[emailIdx] ?? ""
      bedriftsnavn = cells[nameIdx] ?? ""
    } else {
      // No header: find the cell that looks like an email, the other is the name.
      const emailCell = cells.find((c) => EMAIL_RE.test(c)) ?? ""
      epost = emailCell
      bedriftsnavn = cells.filter((c) => c !== emailCell).join(" ").trim() || cells[0] || ""
    }

    epost = epost.trim().toLowerCase()
    bedriftsnavn = bedriftsnavn.trim()
    if (!EMAIL_RE.test(epost) || seen.has(epost)) continue
    seen.add(epost)
    leads.push({ bedriftsnavn: bedriftsnavn || epost, epost })
  }
  return leads
}

function applyMerge(t: string, name: string): string {
  return t.replace(/\{\{\s*bedriftsnavn\s*\}\}/g, name)
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function Sender() {
  const [rawList, setRawList] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const cancelRef = useRef(false)
  const [, startLogout] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const leads = useMemo(() => parseLeads(rawList), [rawList])
  const first = leads[0]

  const previewSubject = first ? applyMerge(subject, first.bedriftsnavn) : ""
  const previewBody = first ? applyMerge(body, first.bedriftsnavn) : ""

  const canSend =
    leads.length > 0 && subject.trim().length > 0 && body.trim().length > 0 && !sending

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRawList(String(reader.result ?? ""))
    reader.readAsText(file)
  }

  async function handleSend() {
    if (!canSend) return
    cancelRef.current = false
    setSending(true)
    const initial: Row[] = leads.map((l) => ({ ...l, status: "pending" }))
    setRows(initial)
    setProgress({ done: 0, total: leads.length })

    for (let i = 0; i < leads.length; i++) {
      if (cancelRef.current) break
      const lead = leads[i]
      setRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "sending" } : r)),
      )

      const result = await sendOne({
        epost: lead.epost,
        bedriftsnavn: lead.bedriftsnavn,
        subject,
        body,
      })

      setRows((prev) =>
        prev.map((r, idx) =>
          idx === i
            ? {
                ...r,
                status: result.ok ? "sent" : "failed",
                detail: result.ok ? result.id : result.error,
              }
            : r,
        ),
      )
      setProgress({ done: i + 1, total: leads.length })

      // Throttle: 3–5s between emails, not a burst. Skip wait after the last one.
      if (i < leads.length - 1 && !cancelRef.current) {
        await delay(3000 + Math.random() * 2000)
      }
    }
    setSending(false)
  }

  const sentCount = rows.filter((r) => r.status === "sent").length
  const failedCount = rows.filter((r) => r.status === "failed").length

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">
          {leads.length} gyldige mottakere lest inn
        </p>
        <button
          type="button"
          onClick={() => startLogout(() => logout().then(() => location.reload()))}
          className="font-mono text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Logg ut
        </button>
      </div>

      {/* Lead list */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-medium">1 · Leadliste</h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs hover:bg-secondary"
            >
              Last opp fil
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Lim inn med kolonnene <code className="font-mono text-foreground">bedriftsnavn</code>{" "}
          og <code className="font-mono text-foreground">epost</code> (komma, semikolon eller
          tab). Overskriftsrad er valgfri.
        </p>
        <textarea
          value={rawList}
          onChange={(e) => setRawList(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder={"bedriftsnavn,epost\nKafé Nord,post@kafenord.no\nBlomster AS,hei@blomster.no"}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </section>

      {/* Template */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-medium">2 · Mal</h2>
        <p className="text-sm text-muted-foreground">
          Bruk <code className="font-mono text-foreground">{"{{bedriftsnavn}}"}</code> der
          bedriftsnavnet skal settes inn.
        </p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Emne – f.eks. En enkel nettside for {{bedriftsnavn}}?"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder={"Hei {{bedriftsnavn}},\n\nJeg lager enkle, rimelige nettsider for nystartede bedrifter …"}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="font-mono text-xs text-muted-foreground">
          Denne linjen legges automatisk til nederst i hver e-post: «{OPT_OUT}».
        </p>
      </section>

      {/* Preview */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-medium">3 · Forhåndsvisning</h2>
        {first ? (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-xs text-muted-foreground">
              Til: {first.bedriftsnavn} &lt;{first.epost}&gt;
            </p>
            <p className="mt-3 text-sm">
              <span className="text-muted-foreground">Emne: </span>
              <span className="font-medium">{previewSubject || "(tomt emne)"}</span>
            </p>
            <hr className="my-3 border-border" />
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {previewBody || "(tom melding)"}
            </div>
            <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
              {OPT_OUT}
            </p>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Legg inn minst én gyldig mottaker for å se forhåndsvisning.
          </p>
        )}
      </section>

      {/* Send */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-medium">4 · Send</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSend} disabled={!canSend}>
            {sending
              ? `Sender… ${progress?.done ?? 0}/${progress?.total ?? 0}`
              : `Send til ${leads.length} mottakere`}
          </Button>
          {sending ? (
            <button
              type="button"
              onClick={() => {
                cancelRef.current = true
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary"
            >
              Stopp
            </button>
          ) : null}
          {rows.length > 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              {sentCount} sendt · {failedCount} feilet
            </p>
          ) : null}
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Én e-post hvert 3–5 sekund for å unngå spamfiltre. Lukk ikke fanen mens
          utsending pågår.
        </p>
      </section>

      {/* Results */}
      {rows.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-lg font-medium">Resultat</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary font-mono text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Bedrift</th>
                  <th className="px-4 py-2 font-medium">E-post</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.epost} className="border-t border-border align-top">
                    <td className="px-4 py-2">{r.bedriftsnavn}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.epost}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} detail={r.detail} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function StatusBadge({ status, detail }: { status: Status; detail?: string }) {
  const map: Record<Status, { label: string; className: string }> = {
    pending: { label: "I kø", className: "text-muted-foreground" },
    sending: { label: "Sender…", className: "text-foreground" },
    sent: { label: "Sendt", className: "text-teal" },
    failed: { label: "Feilet", className: "text-destructive" },
  }
  const s = map[status]
  return (
    <span className="flex flex-col gap-0.5">
      <span className={`font-mono text-xs font-medium ${s.className}`}>{s.label}</span>
      {status === "failed" && detail ? (
        <span className="max-w-xs text-xs text-muted-foreground">{detail}</span>
      ) : null}
    </span>
  )
}
