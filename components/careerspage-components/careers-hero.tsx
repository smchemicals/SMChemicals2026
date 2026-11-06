"use client";

import { getLenis } from "@/lib/smooth-scroll";
import { PageHero } from "@/components/ui/page-hero";
import { CtaButton } from "@/components/ui/cta-button";

export function CareersHero() {
	const toRoles = (e: React.MouseEvent) => {
		const el = document.getElementById("roles");
		if (!el) return;
		e.preventDefault();
		const lenis = getLenis();
		if (lenis) lenis.scrollTo(el, { offset: -40 });
		else el.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<PageHero
			lines={["Join the", "team."]}
			lede="Build the chemistry behind India&apos;s industry. We are always looking for curious, rigorous people to grow with us."
		>
			<CtaButton href="#roles" onClick={toRoles} arrow="down">
				View open roles
			</CtaButton>
		</PageHero>
	);
}
