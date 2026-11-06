"use client";

import type { HomeContent } from "@/data/content";
import { CtaButton } from "@/components/ui/cta-button";
import { Button } from "@/components/ui/button";
import { openInquiry } from "@/lib/inquiry";
import { PageHero } from "@/components/ui/page-hero";

export default function HeroSection({ sectors }: HomeContent) {
	return (
		<PageHero
			lines={["High-precision", "chemistry for"]}
			rotate={["wastewater.", "construction.", "textiles.", "laundry care.", "aquaculture.", "paper & pulp."]}
			lede={
				<>
					We make water treatment, construction, textile and process chemicals in
					Hyderabad, and supply them to industry across India.
					<span className="sr-only">Serving {sectors.join(", ")}</span>
				</>
			}
		>
			<CtaButton href="/products" arrow="right">Browse products</CtaButton>
			<Button variant="outline" arrow="right" onClick={() => openInquiry("quote")}>
				Request a quote
			</Button>
		</PageHero>
	);
}
