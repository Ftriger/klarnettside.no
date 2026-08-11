import { Receipt } from '@/components/receipt'
import { StructuredData, faqs } from '@/components/structured-data'

const steps = [
  {
    num: '01',
    title: 'Du sender innhold',
    text: 'Send meg tekst og bilder du vil ha med. Ingenting mer.',
  },
  {
    num: '02',
    title: 'Jeg bygger siden',
    text: 'Jeg setter opp en enkel og profesjonell nettside for deg.',
  },
  {
    num: '03',
    title: 'Siden går live',
    text: 'Vi legger den ut på ditt eget domene når du er fornøyd.',
  },
]

const trust = [
  'Du betaler ikke før du er fornøyd med resultatet',
  'Ingen teknisk kunnskap kreves fra deg',
  'Laget for nystartede bedrifter i Norge',
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <StructuredData />
      <div className="mx-auto flex max-w-3xl flex-col gap-24 px-6 py-12 sm:py-16">
        {/* Eyebrow */}
        <header>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal" />
            <span className="font-mono text-xs tracking-wide text-muted-foreground">
              klarnettside.no
            </span>
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-col gap-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal">
            Nettside til fast pris
          </p>
          <h1 className="text-balance font-serif text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Nettside. Enkelt <span className="italic text-teal">og greit.</span>
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Jeg bygger en enkel, profesjonell nettside for din nye bedrift. Du
            sender meg tekst og bilder, jeg ordner resten. Ingen skjulte
            kostnader, ingen bindingstid du ikke ser komme.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="mailto:post@klarnettside.no"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ta kontakt
              <span aria-hidden="true">&rarr;</span>
            </a>
            <span className="font-mono text-sm text-muted-foreground">
              Fra 5000 kr
            </span>
          </div>
        </section>

        {/* Process */}
        <section className="grid gap-10 sm:grid-cols-3">
          <h2 className="sr-only">Slik fungerer det</h2>
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col gap-3">
              <span className="font-mono text-sm text-teal">{step.num}</span>
              <h3 className="font-serif text-xl text-ink">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </div>
          ))}
        </section>

        {/* Receipt */}
        <section id="priser" data-pricing className="flex flex-col items-center gap-8">
          <div className="max-w-md text-center">
            <h2 className="font-serif text-3xl text-ink">Hva det koster</h2>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              Alt er oppgitt på forhånd. Ingen overraskelser.
            </p>
          </div>
          <Receipt />
        </section>

        {/* Trust */}
        <section className="flex flex-col gap-4 border-t border-border pt-10">
          <h2 className="sr-only">Hvorfor velge klarnettside.no</h2>
          {trust.map((item) => (
            <div key={item} className="flex items-baseline gap-3">
              <span aria-hidden="true" className="font-mono text-sm text-teal">
                +
              </span>
              <p className="text-lg leading-relaxed text-ink">{item}</p>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="flex flex-col gap-6 border-t border-border pt-10">
          <h2 className="font-serif text-3xl text-ink">Ofte stilte spørsmål</h2>
          <div className="flex flex-col">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group border-b border-border py-4"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-serif text-lg text-ink marker:content-['']">
                  {faq.q}
                  <span
                    aria-hidden="true"
                    className="font-mono text-teal transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-2 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-sm text-muted-foreground">
            klarnettside.no
          </span>
          <a
            href="mailto:post@klarnettside.no"
            className="font-mono text-sm text-teal underline-offset-4 hover:underline"
          >
            post@klarnettside.no
          </a>
        </footer>
      </div>
    </div>
  )
}
