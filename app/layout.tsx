import type { Metadata, Viewport } from 'next'
import { Inter, Sora, Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SITE } from '@/lib/site'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" });

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1c28' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'SM Chemicals | Industrial Chemical Solutions',
    template: '%s | SM Chemicals',
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'industrial chemicals', 'water treatment chemicals', 'ETP chemicals',
    'STP chemicals', 'cooling tower chemicals', 'boiler chemicals',
    'textile chemicals', 'construction chemicals', 'chemical supplier India',
    'Hyderabad chemicals',
  ],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: 'SM Chemicals | Industrial Chemical Solutions',
    description: SITE.description,
    url: SITE.url,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SM Chemicals | Industrial Chemical Solutions',
    description: SITE.description,
  },
  alternates: { canonical: '/' },
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sora.variable} ${instrument.variable}`}>
      <head>
        {/* Set the theme before first paint so there is no flash: saved choice, else the system's. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('smc:theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
        {/* A shared link to a chemical (?product=): keep the page behind it unseen until the chemical has opened, so the
            page never shows and then has the chemical pop over it. The products page lifts this once it has opened it. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(/[?&]product=/.test(location.search)){var h=document.documentElement;h.classList.add('deep-link');setTimeout(function(){h.classList.remove('deep-link')},4000)}}catch(e){}`,
          }}
        />
        <noscript>
          <style>{`html.deep-link main > *,html.deep-link #catalogue > *,html.deep-link footer{visibility:visible!important}`}</style>
        </noscript>
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
