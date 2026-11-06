"use client";

import { getLenis } from "@/lib/smooth-scroll";
import { PageHero } from "@/components/ui/page-hero";
import { CtaButton } from "@/components/ui/cta-button";

export default function ProductsHeader() {
	const toCatalogue = (e: React.MouseEvent) => {
		const el = document.getElementById("catalogue");
		if (!el) return;
		e.preventDefault();
		const lenis = getLenis();
		if (lenis) lenis.scrollTo(el, { offset: -20 });
		else el.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<PageHero
			lines={["Chemical", "portfolio."]}
			lede="High-purity industrial compounds, engineered for consistency and verified for scale."
		>
			<CtaButton href="#catalogue" onClick={toCatalogue} arrow="down">
				Browse the catalogue
			</CtaButton>
		</PageHero>
	);
}
