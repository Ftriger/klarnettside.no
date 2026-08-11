import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google'
import { Tracker } from '@/components/tracker'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

const SITE_URL = 'https://klarnettside.no'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Klarnettside — Enkel nettside for din nye bedrift | Fast pris',
    template: '%s | Klarnettside',
  },
  description:
    'Få en enkel, profesjonell nettside til din nye bedrift for fast pris. Du sender tekst og bilder, jeg ordner resten. Ingen skjulte kostnader, ingen teknisk kunnskap kreves. Rimelig webdesign for nystartede bedrifter i Norge.',
  applicationName: 'Klarnettside',
  generator: 'v0.app',
  keywords: [
    'nettside',
    'enkel nettside',
    'billig nettside',
    'lage nettside',
    'nettside til bedrift',
    'webdesign Norge',
    'hjemmeside bedrift',
    'nettside fast pris',
    'nettside nystartet bedrift',
    'webutvikler Norge',
    'klarnettside',
  ],
  authors: [{ name: 'Klarnettside' }],
  creator: 'Klarnettside',
  publisher: 'Klarnettside',
  category: 'business',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    url: SITE_URL,
    siteName: 'Klarnettside',
    title: 'Klarnettside — Enkel nettside for din nye bedrift | Fast pris',
    description:
      'Få en enkel, profesjonell nettside til din nye bedrift for fast pris. Du sender tekst og bilder, jeg ordner resten. Ingen skjulte kostnader.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Klarnettside — Nettside. Enkelt og greit.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Klarnettside — Enkel nettside for din nye bedrift',
    description:
      'Få en enkel, profesjonell nettside til din nye bedrift for fast pris. Ingen skjulte kostnader.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F7F6F3',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="nb"
      className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable} bg-background`}
    >
      <body className="antialiased">
        {children}
        <Tracker />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
