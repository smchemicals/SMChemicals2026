import { draftMode } from 'next/headers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SmoothScroll } from '@/components/providers/smooth-scroll'
import { PreviewBanner } from '@/components/preview-banner'
import { getPublishedContact } from '@/lib/cms/snapshots'
import { SITE } from '@/lib/site'

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const contact = await getPublishedContact()
  const { isEnabled: isDraft } = await draftMode()

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/smc_logo.png`,
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
  }

  return (
    <SmoothScroll>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer phone={contact.phone} email={contact.email} />
      </div>
      {isDraft && <PreviewBanner />}
    </SmoothScroll>
  )
}
