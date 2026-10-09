import { Metadata } from "next";
import { AboutHero } from "@/components/aboutpage-components/about-hero";
import { AboutValues } from "@/components/aboutpage-components/about-values";
import { AboutTimeline } from "@/components/aboutpage-components/about-timeline";
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
            <AboutValues content={about.values} />
            <AboutTimeline content={about.timeline} />
            <AboutCertifications content={about.certifications} />
        </>
    );
}