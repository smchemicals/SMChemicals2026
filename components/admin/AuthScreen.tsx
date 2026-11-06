"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { LiquidField } from "@/components/ui/liquid-field";
import { ThemeToggle } from "@/components/theme-toggle";

/*
 * The front door, shared by every screen before the admin proper (sign in, the code from the authenticator app, setting it up):
 * the website's liquid hero, the headline in the same huge type rising out of its line, and the form on the right
 * from the 8th column of the same 12-column grid. Put `data-in` on each piece of the form so it follows the headline in.
 */
export function AuthScreen({ title, children }: { title: string; children: ReactNode }) {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap.set("[data-line]", { yPercent: 135 });
				gsap.set("[data-in]", { autoAlpha: 0, y: 16 });
				gsap
					.timeline({ defaults: { ease: "expoOut" } })
					.to("[data-line]", { yPercent: 0, duration: 1.3 }, 0.1)
					.to("[data-in]", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.5);
			});
		},
		{ scope: root },
	);

	return (
		<section ref={root} data-surface="hero" className="relative flex min-h-svh flex-col justify-end overflow-hidden bg-background text-foreground">
			<div aria-hidden className="field-in absolute inset-0">
				<LiquidField />
			</div>

			<div className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
				<span className="font-heading text-xl font-semibold tracking-[-0.03em]">SM Chemicals</span>
				<ThemeToggle className="text-base text-foreground/75 hover:text-foreground" />
			</div>

			<div className="relative mx-auto w-full max-w-7xl px-6 pb-14 pt-40 sm:px-10 lg:pb-20">
				<div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-x-10">
					<h1 className={`font-heading font-semibold leading-[0.92] tracking-[-0.03em] lg:col-span-7 ${title.length > 10 ? "text-[clamp(2.5rem,7.5vw,7rem)]" : "text-[clamp(3rem,10vw,9rem)]"}`}>
						<span className="block overflow-hidden -mx-[0.05em] -mb-[0.16em] -mt-[0.1em] px-[0.05em] pb-[0.24em] pt-[0.1em]">
							<span data-line className="block">{title}</span>
						</span>
					</h1>
					<div className="flex flex-col gap-6 lg:col-span-5">{children}</div>
				</div>
			</div>
		</section>
	);
}

/* The larger field and label used on these screens. */
export const AUTH_FIELD =
	"h-14 w-full rounded-lg bg-surface px-4 text-lg text-foreground outline-none ring-2 ring-transparent transition-shadow placeholder:text-muted/70 hover:ring-foreground/15 focus:ring-accent";
export const AUTH_LABEL = "[&>span:first-child]:text-base [&>span:first-child]:text-foreground/90";
