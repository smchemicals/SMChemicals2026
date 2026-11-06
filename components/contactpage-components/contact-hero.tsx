"use client";

import { ArrowUpRight } from "lucide-react";
import { mapsLink, type ContactContent } from "@/data/content";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/button";
import { openInquiry } from "@/lib/inquiry";
import { useOpenStatus } from "@/hooks/use-open-status";

/* Large contact link; its arrow swaps corner-to-corner on hover. */
function BigLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
	return (
		<a
			href={href}
			{...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
			className="group/c flex items-center gap-3 font-heading text-[clamp(1.25rem,2.1vw,1.875rem)] font-semibold tracking-[-0.03em] text-foreground outline-none transition-opacity duration-300 group-hover/l:opacity-45 hover:opacity-100! focus-visible:opacity-100!"
		>
			<span className="break-all sm:break-normal">{children}</span>
			<span className="relative block h-[0.9em] w-[0.9em] shrink-0 overflow-hidden">
				<ArrowUpRight aria-hidden strokeWidth={2} className="absolute inset-0 h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/c:translate-x-full group-hover/c:-translate-y-full" />
				<ArrowUpRight aria-hidden strokeWidth={2} className="absolute inset-0 h-full w-full -translate-x-full translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/c:translate-x-0 group-hover/c:translate-y-0" />
			</span>
		</a>
	);
}

export function ContactHero({ contact }: { contact: ContactContent }) {
	const status = useOpenStatus(contact.hours);
	return (
		<PageHero
			lines={["Start a", "conversation."]}
			lede="Ask about a product, request a quote or talk through a custom blend. We reply within two working days."
			action={
				<Button variant="primary" size="lg" arrow="up-right" onClick={() => openInquiry("general")}>
					Write to us
				</Button>
			}
		>
			{/* Hovering one link dims the others, so the one you are on stays at full contrast over the liquid. */}
			<div className="group/l flex flex-col gap-3">
				<BigLink href={`mailto:${contact.email}`}>{contact.email}</BigLink>
				<BigLink href={`tel:${contact.phone.replace(/\s+/g, "")}`}>{contact.phone}</BigLink>
				<BigLink href={mapsLink(contact)} external>
					{contact.addressLines.map((l, i) => (
						<span key={i} className="block">{l}</span>
					))}
				</BigLink>
				{/* Opening hours, with whether the office is open right now (India time). */}
				<p className="mt-2 text-base leading-[1.5] text-foreground/70">
					{contact.hours}
					{status && <span className="block text-foreground">{status.label}</span>}
				</p>
			</div>
		</PageHero>
	);
}
