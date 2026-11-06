"use client";

import type { HomeContent } from "@/data/content";
import { CtaButton } from "@/components/ui/cta-button";
import { Button } from "@/components/ui/button";
import { openInquiry } from "@/lib/inquiry";
import { PageHero } from "@/components/ui/page-hero";

export default function HeroSection({ sectors, heroText }: Pick<HomeContent, "sectors" | "heroText">) {
	return (
		<PageHero
			lines={["High-precision", "chemistry for"]}
			rotate={sectors.map((w) => `${w}.`)}
			lede={heroText}
		>
			<CtaButton href="/products" arrow="right">Browse products</CtaButton>
			<Button variant="outline" arrow="right" onClick={() => openInquiry("quote")}>
				Request a quote
			</Button>
		</PageHero>
	);
}
