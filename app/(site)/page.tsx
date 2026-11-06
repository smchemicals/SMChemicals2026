import HeroSection from "@/components/homepage-components/hero-section"
import { ProofBand } from "@/components/homepage-components/proof-band"
import { IndustriesSection } from "@/components/homepage-components/industries-section"
import { FeaturesSection } from "@/components/homepage-components/features-section"
import { getPublishedHome, getPublishedCatalog } from "@/lib/cms/snapshots"
import type { Metadata } from "next"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default async function HomePage() {
  const [home, catalog] = await Promise.all([
    getPublishedHome(),
    getPublishedCatalog(),
  ])

  return (
    <>
      <HeroSection sectors={home.sectors} stats={home.stats} tagline={home.tagline} />
      <ProofBand sectors={home.sectors} stats={home.stats} />
      <IndustriesSection categories={catalog} />
      <FeaturesSection />
    </>
  )
}
