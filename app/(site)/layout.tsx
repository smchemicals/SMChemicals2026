import { draftMode } from 'next/headers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SmoothScroll } from '@/components/providers/smooth-scroll'
import { PreviewBanner } from '@/components/preview-banner'
import { Preloader } from '@/components/preloader'
import { PageTransition } from '@/components/page-transition'
import { ScrollMotion } from '@/components/scroll-motion'
import { InquiryOverlay } from '@/components/inquiry-overlay'
import { StorageNotice } from '@/components/storage-notice'
import { ViewTracker } from '@/components/view-tracker'
import { getPublishedCatalog, getPublishedContact } from '@/lib/cms/snapshots'
import { SITE } from '@/lib/site'

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [contact, catalog] = await Promise.all([getPublishedContact(), getPublishedCatalog()])
  // Only what the inquiry form needs: industries and the names of the chemicals under each.
  const inquiryCatalog = [...catalog]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name, products: [...c.products].sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ id: p.id, name: p.name })) }))
  const { isEnabled: isDraft } = await draftMode()

  const orgId = `${SITE.url}/#organization`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'LocalBusiness'],
        '@id': orgId,
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/smc_logo.png`,
        image: `${SITE.url}/opengraph-image`,
        email: contact.email,
        telephone: contact.phone,
        description: SITE.description,
        address: {
          '@type': 'PostalAddress',
          streetAddress: contact.addressLines.join(', '),
          addressLocality: 'Hyderabad',
          addressRegion: 'Telangana',
          addressCountry: 'IN',
        },
        areaServed: 'IN',
        knowsAbout: [
          'Water treatment chemicals',
          'ETP and STP chemicals',
          'Cooling tower and boiler chemicals',
          'Textile chemicals',
          'Construction chemicals',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        inLanguage: 'en-IN',
        publisher: { '@id': orgId },
      },
    ],
  }

  return (
    <SmoothScroll>
      <Preloader />
      <PageTransition />
      <ScrollMotion />
      <InquiryOverlay catalog={inquiryCatalog} />
      <StorageNotice />
      <ViewTracker />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-dvh flex-col">
        <Header phone={contact.phone} email={contact.email} hours={contact.hours} addressLines={contact.addressLines} />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer phone={contact.phone} email={contact.email} addressLines={contact.addressLines} />
      </div>
      {isDraft && <PreviewBanner />}
    </SmoothScroll>
  )
}
