import { Metadata } from "next";
import { AboutHero } from "@/components/aboutpage-components/about-hero";
import { AboutStack } from "@/components/aboutpage-components/about-stack";
import { AboutCta } from "@/components/aboutpage-components/about-cta";
import { AboutCertifications } from "@/components/aboutpage-components/about-certifications";
import { getPublishedAbout } from "@/lib/cms/snapshots";

export const metadata: Metadata = {
    title: "About",
    description: "Since 2008, SM Chemicals has engineered high-precision industrial chemicals for India's infrastructure. Learn about our standards, journey and certifications.",
    alternates: { canonical: "/about" },
};

export default async function AboutPage() {
    const about = await getPublishedAbout();

    return (
        <>
            <AboutHero />
            <AboutStack values={about.values} timeline={about.timeline} />
            <AboutCertifications content={about.certifications} />
            <AboutCta />
        </>
    );
}