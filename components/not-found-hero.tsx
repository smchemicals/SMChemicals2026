"use client";

import { StatusHero } from "@/components/status-hero";
import { ButtonLink } from "@/components/ui/button";

/* The 404: a plain explanation and two ways out. */
export function NotFoundHero() {
	return (
		<StatusHero
			bigFirst
			lines={["404", "Not in the", "catalogue."]}
			text="The link may be old, or the page may have moved. Go back to the homepage or look through the chemicals directly."
		>
			<ButtonLink href="/" arrow="right">
				Go to homepage
			</ButtonLink>
			<ButtonLink href="/products" variant="outline" arrow="right">
				Browse chemicals
			</ButtonLink>
		</StatusHero>
	);
}
