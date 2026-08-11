const SITE_URL = 'https://klarnettside.no'

export const faqs = [
  {
    q: 'Hva koster en nettside?',
    a: 'Levering av en enkel, ferdig nettside koster 5000 kr som en fast engangspris. Domeneregistrering er valgfritt til 500 kr, og drift, hosting og løpende endringer koster 2000 kr per måned. Alt er oppgitt på forhånd uten skjulte kostnader.',
  },
  {
    q: 'Trenger jeg teknisk kunnskap?',
    a: 'Nei. Du sender meg tekst og bilder du vil ha med, så bygger jeg hele nettsiden for deg. Du trenger ikke kunne noe om koding, design eller domener.',
  },
  {
    q: 'Når betaler jeg?',
    a: 'Du betaler ikke for selve nettsiden før du har sett resultatet og er fornøyd. Ingen forskuddsbetaling for leveransen.',
  },
  {
    q: 'Hvor lang bindingstid er det?',
    a: 'Ingen skjult bindingstid. Drift og hosting løper månedlig, og endringer avtales fortløpende.',
  },
  {
    q: 'Hvem passer dette for?',
    a: 'Tjenesten er laget for nystartede og små bedrifter i Norge som trenger en enkel, profesjonell nettside raskt og rimelig.',
  },
]

export function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['ProfessionalService', 'WebSite'],
        '@id': `${SITE_URL}/#business`,
        name: 'Klarnettside',
        url: SITE_URL,
        description:
          'Enkel, profesjonell nettside til din nye bedrift for fast pris. Du sender tekst og bilder, jeg ordner resten.',
        email: 'post@klarnettside.no',
        image: `${SITE_URL}/og-image.png`,
        priceRange: 'fra 5000 kr',
        areaServed: {
          '@type': 'Country',
          name: 'Norge',
        },
        inLanguage: 'nb-NO',
        makesOffer: [
          {
            '@type': 'Offer',
            name: 'Levering av nettside',
            description: 'En ferdig, enkel og profesjonell nettside.',
            price: '5000',
            priceCurrency: 'NOK',
          },
          {
            '@type': 'Offer',
            name: 'Domeneregistrering',
            description: 'Valgfri registrering av eget domene.',
            price: '500',
            priceCurrency: 'NOK',
          },
          {
            '@type': 'Offer',
            name: 'Drift og hosting',
            description: 'Månedlig drift, hosting og løpende endringer.',
            price: '2000',
            priceCurrency: 'NOK',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
