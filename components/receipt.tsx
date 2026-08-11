const zigzagTop =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='12' viewBox='0 0 16 12'%3E%3Cpath d='M0 6 L8 0 L16 6 V12 H0 Z' fill='%23ffffff'/%3E%3C/svg%3E\")"

const zigzagBottom =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='12' viewBox='0 0 16 12'%3E%3Cpath d='M0 0 H16 V6 L8 12 L0 6 Z' fill='%23ffffff'/%3E%3C/svg%3E\")"

function ReceiptLine({
  label,
  price,
  note,
}: {
  label: string
  price: string
  note: string
}) {
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-ink">{label}</span>
        <span
          aria-hidden="true"
          className="mx-1 flex-1 translate-y-[-2px] border-b border-dashed border-ink/30"
        />
        <span className="whitespace-nowrap font-medium text-ink">{price}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

export function Receipt() {
  return (
    <div className="w-full max-w-sm font-mono text-sm">
      <div
        aria-hidden="true"
        className="h-3 w-full"
        style={{
          backgroundImage: zigzagTop,
          backgroundSize: '16px 12px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'bottom',
        }}
      />
      <div className="border-x border-dashed border-ink/30 bg-card px-6 pb-6">
        <div className="border-b border-dashed border-ink/30 pb-4 pt-2 text-center">
          <p className="text-base font-semibold tracking-[0.2em] text-ink">
            KVITTERING
          </p>
          <p className="mt-1 text-xs text-muted-foreground">klarnettside.no</p>
        </div>

        <div className="divide-y divide-dashed divide-ink/20">
          <ReceiptLine
            label="Levering av nettside"
            price="5000 kr"
            note="Betales først når du er fornøyd."
          />
          <ReceiptLine
            label="Domeneregistrering"
            price="500 kr"
            note="Valgfritt."
          />
          <ReceiptLine
            label="Drift og hosting"
            price="2000 kr/mnd"
            note="Endringer avtales fortløpende."
          />
        </div>

        <div className="mt-4 border-t border-dashed border-ink/30 pt-4 text-center text-xs text-muted-foreground">
          Takk for handelen
        </div>
      </div>
      <div
        aria-hidden="true"
        className="h-3 w-full"
        style={{
          backgroundImage: zigzagBottom,
          backgroundSize: '16px 12px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'top',
        }}
      />
    </div>
  )
}
