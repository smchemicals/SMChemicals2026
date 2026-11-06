"use client";

import { Button } from "@/components/ui/button";
import { openInquiry } from "@/lib/inquiry";
import { useReveal } from "@/hooks/use-reveal";

export function AboutCta() {
	const scope = useReveal<HTMLDivElement>({ y: 20, blur: 0, duration: 1, stagger: 0.1, scroll: true, start: "top 80%" });
	return (
		<section data-header="light" className="overflow-hidden bg-cta text-cta-foreground">
			<div ref={scope} className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24 sm:px-10 md:flex-row md:items-end md:justify-between lg:py-36">
				<div>
					<h2 data-reveal className="font-heading text-[clamp(2.5rem,7vw,7rem)] font-semibold leading-[0.95] tracking-tighter">
						Let&rsquo;s work
						<br />
						together.
					</h2>
					<p data-reveal className="mt-6 max-w-md text-xl leading-[1.55] text-white/80">
						Tell us what your plant needs and our team will get back to you.
					</p>
				</div>
				<Button data-reveal variant="light" size="lg" arrow="up-right" onClick={() => openInquiry("team")} className="self-start md:self-auto">
					Talk to our team
				</Button>
			</div>
		</section>
	);
}
