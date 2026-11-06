"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { LiquidField } from "@/components/ui/liquid-field";
import { RotatingWord } from "@/components/ui/rotating-word";
import { LiquidCode } from "@/components/ui/liquid-code";

/*
 * The one hero every page uses, so the headline, the gap beneath it, the lede and the
 * action area sit in exactly the same place from page to page. Content is anchored to the
 * bottom of the screen, and it is always a full screen tall, the same as the home page's.
 */
export function PageHero({
	lines,
	rotate,
	bigFirst = false,
	lede,
	action,
	children,
	flex = false,
}: {
	lines: string[];
	/** A final headline line that changes through these words (liquid reveal). */
	rotate?: string[];
	/** Sets the first line much larger, in the accent, for a status code such as 404. */
	bigFirst?: boolean;
	lede: ReactNode;
	action?: ReactNode;
	children?: ReactNode;
	flex?: boolean;
}) {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap.set("[data-line]", { yPercent: 135 });
				gsap.set("[data-in]", { autoAlpha: 0, y: 16 });
				gsap
					.timeline({ defaults: { ease: "expoOut" } })
					.to("[data-line]", { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.1)
					.to("[data-in]", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.7);
			});
		},
		{ scope: root },
	);

	return (
		<section
			ref={root}
			data-surface="hero"
			className={`relative flex flex-col justify-end overflow-hidden bg-background text-foreground min-h-svh ${flex ? "flex-1" : ""}`}
		>
			<LiquidField />
			<div className="relative mx-auto w-full max-w-7xl px-6 pb-14 pt-40 sm:px-10 lg:pb-20">
				<h1 className="font-heading text-[clamp(2.4rem,9.5vw,10rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-foreground">
					{lines.map((line, n) =>
						bigFirst && n === 0 ? (
							// A status code is made of the liquid itself (it has its own entrance, so it isn't one of the sliding lines).
							<span key={line} className="block text-[1.7em] leading-[0.9] text-accent-ink">
								<LiquidCode text={line} />
							</span>
						) : (
							<span key={line} className="block overflow-hidden -mx-[0.05em] -mb-[0.16em] -mt-[0.1em] px-[0.05em] pb-[0.24em] pt-[0.1em]">
								<span data-line className="block">
									{line}
								</span>
							</span>
						),
					)}
					{rotate && (
						<span className="block overflow-hidden -mx-[0.05em] -mb-[0.16em] -mt-[0.1em] px-[0.05em] pb-[0.24em] pt-[0.1em]">
							<span data-line className="block">
								<RotatingWord words={rotate} />
							</span>
						</span>
					)}
				</h1>

				{/* Same 12-column grid as the footer and every list: the lede on the left, actions from column 8. */}
				<div className="mt-12 grid gap-8 md:mt-16 lg:grid-cols-12 lg:items-center lg:gap-x-10">
					<div className="lg:col-span-6">
						<p data-in className="max-w-[26rem] text-pretty text-lg leading-[1.55] tracking-[-0.005em] text-foreground/75 md:text-xl">
							{lede}
						</p>
						{action && (
							<div data-in className="mt-8">
								{action}
							</div>
						)}
					</div>
					{children && (
						<div data-in className="flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-5 lg:col-start-8">
							{children}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
