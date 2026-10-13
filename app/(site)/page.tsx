import HeroSection from "@/components/homepage-components/hero-section"
import { IndustriesSection } from "@/components/homepage-components/industries-section"
import { FeaturesSection } from "@/components/homepage-components/features-section"
import { CtaSection } from "@/components/homepage-components/cta-section"
import { getPublishedHome, getPublishedContact, getPublishedCatalog } from "@/lib/cms/snapshots"
import type { Metadata } from "next"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default async function HomePage() {
  const [home, contact, catalog] = await Promise.all([
    getPublishedHome(),
    getPublishedContact(),
    getPublishedCatalog(),
  ])

  return (
    <>
      <HeroSection sectors={home.sectors} stats={home.stats} tagline={home.tagline} />
      <IndustriesSection categories={catalog} />
      <FeaturesSection />
      <CtaSection phone={contact.phone} email={contact.email} />
    </>
  )
}
