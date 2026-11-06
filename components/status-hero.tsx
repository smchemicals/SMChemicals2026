"use client";

import { PageHero } from "@/components/ui/page-hero";

/* Full-screen hero for system states (not found, error): big message, short explanation, actions. */
export function StatusHero({
	lines,
	text,
	bigFirst,
	children,
}: {
	lines: string[];
	bigFirst?: boolean;
	text: string;
	children: React.ReactNode;
}) {
	return (
		<PageHero lines={lines} lede={text} bigFirst={bigFirst} flex>
			{children}
		</PageHero>
	);
}
