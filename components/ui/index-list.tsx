"use client";

import { useReveal } from "@/hooks/use-reveal";

export type IndexItem = { lead: string; title?: string | null; text: string };

/*
 * The site's list pattern: each item is a single stack, its heading directly above its text, with
 * clear space before the next one. No cards, no rules, no scroll tricks. Pages put the section
 * heading in the left column and this list in the right.
 */
export function IndexList({ items }: { items: IndexItem[] }) {
	const scope = useReveal<HTMLUListElement>({ y: 20, blur: 0, duration: 0.9, stagger: 0.06, scroll: true, start: "top 85%" });
	return (
		<ul ref={scope} className="grid gap-14 lg:gap-16">
			{items.map((it, i) => (
				<li key={`${it.lead}-${i}`} data-reveal className="max-w-2xl">
					<p
						className={`font-heading font-semibold leading-[1.1] tracking-[-0.03em] ${
							it.title ? "text-[clamp(1.5rem,2.4vw,2rem)] text-accent-ink" : "text-[clamp(1.5rem,2.2vw,2rem)]"
						}`}
					>
						{it.lead}
					</p>
					{it.title && (
						<h3 className="mt-3 font-heading text-[clamp(1.375rem,2.2vw,2rem)] font-semibold leading-tight tracking-[-0.02em]">
							{it.title}
						</h3>
					)}
					<p className="mt-3 text-[clamp(1.125rem,1.5vw,1.375rem)] leading-[1.5] text-foreground/75">{it.text}</p>
				</li>
			))}
		</ul>
	);
}
