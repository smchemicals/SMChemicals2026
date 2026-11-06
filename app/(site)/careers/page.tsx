import { Metadata } from "next";
import { CareersHero } from "@/components/careerspage-components/careers-hero";
import { CareersOpenings } from "@/components/careerspage-components/careers-openings";
import { getPublishedCareers } from "@/lib/cms/snapshots";

export const metadata: Metadata = {
	title: "Careers",
	description:
		"Join SM Chemicals. Explore open roles across R&D, sales, quality and operations, or send a general application.",
	alternates: { canonical: "/careers" },
};

export default async function CareersPage() {
	const careers = await getPublishedCareers();

	return (
		<>
			<CareersHero />
			<CareersOpenings content={careers} />
		</>
	);
}
