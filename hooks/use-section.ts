"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { revealCells } from "@/lib/reveal-cells";

interface SectionOptions {
	// Entry (staggered reveal of [data-reveal] children as the section enters)
	selector?: string;
	y?: number;
	blur?: number;
	duration?: number;
	stagger?: number;
	ease?: string;
	start?: string;
	// Play the entry immediately on mount (no scroll trigger). Rarely needed —
	// the default ScrollTrigger path already handles sections in view at load.
	onMount?: boolean;
	delay?: number;
	// Exit (scrubbed fade + drift-up of the scope as it scrolls off the top)
	exit?: boolean;
	exitY?: number;
	exitFade?: number;
	exitStart?: string;
	exitEnd?: string;
}

/**
 * One ref per section: staggered entry on its `[data-reveal]` children, the
 * card-grid reveal on any `[data-cell]` inside it (see lib/reveal-cells.ts),
 * plus a scrubbed fade + drift-up exit on the scope element as it leaves.
 */
export function useSection<T extends HTMLElement = HTMLDivElement>(
	opts: SectionOptions = {},
) {
	const {
		selector = "[data-reveal]",
		y = 26,
		blur = 4,
		duration = 0.8,
		stagger = 0.08,
		ease = "expo",
		start = "top 85%",
		onMount = false,
		delay = 0.1,
		exit = true,
		exitY = -60,
		exitFade = 0,
		exitStart = "top top",
		exitEnd = "bottom top",
	} = opts;

	const scope = useRef<T>(null);

	useGSAP(
		() => {
			const el = scope.current;
			if (!el) return;

			const targets = gsap.utils.toArray<HTMLElement>(selector, el);
			if (targets.length) {
				gsap.set(targets, {
					autoAlpha: 0,
					y,
					filter: `blur(${blur}px)`,
				});

				if (onMount) {
					// Escape hatch: play immediately, no scroll trigger.
					gsap.to(targets, {
						autoAlpha: 1,
						y: 0,
						filter: "blur(0px)",
						duration,
						ease,
						stagger,
						delay,
						overwrite: true,
					});
				} else {
					// One ScrollTrigger (NOT batch) for the whole group. Fires on
					// scroll AND reliably for a section already in view at load —
					// batch is what mis-fires the in-view case under Lenis. Same
					// path for every section → consistent everywhere.
					gsap.to(targets, {
						autoAlpha: 1,
						y: 0,
						filter: "blur(0px)",
						duration,
						ease,
						stagger,
						overwrite: true,
						scrollTrigger: { trigger: el, start, once: true },
					});
				}
			}

			revealCells(el);

			if (exit) {
				gsap.to(el, {
					y: exitY,
					autoAlpha: exitFade,
					ease: "none",
					scrollTrigger: {
						trigger: el,
						start: exitStart,
						end: exitEnd,
						scrub: true,
					},
				});
			}
		},
		{ scope },
	);

	return scope;
}
