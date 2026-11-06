"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/*
 * Scroll-driven enter and exit for every section, in one place. The scroll position is the clock (scrubbed):
 *
 *  - Enter: as a section rises into view its content lifts into place, from slightly low, small and faint to
 *    full size and strength, finishing by the time it is about half way up the screen.
 *  - Exit: as it leaves the top the content recedes, drifting up, shrinking a touch and fading, before it is gone.
 *  - Inside a section, each block also rises in one after another (blocks that choreograph themselves, marked
 *    data-reveal, data-line or data-in, keep their own entrance).
 *
 * The backgrounds stay put, so the page reads as layers of content passing over fixed grounds. Sections with their
 * own scroll scenes (sticky or pinned parts) opt out with data-motion="off". Reduced motion gets none of it.
 */
const MARKED = "[data-reveal],[data-line],[data-in]";

/* React marks the DOM nodes it has hydrated; until then the markup is still the server's and must not be touched. */
const hydrated = (el: Element) => Object.keys(el).some((k) => k.startsWith("__reactFiber"));

export function ScrollMotion() {
	const pathname = usePathname();

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let ctx: gsap.Context | null = null;
		let cancelled = false;
		let tries = 0;

		const setup = () => {
			const main = document.querySelector("main");
			if (!main) return;
			// Wait for the page's own content to hydrate (the page can stream in after the layout), so GSAP's inline styles
			// are never on markup React hasn't claimed yet. Gives up after a few seconds and runs anyway.
			// While the loading screen is up there are no sections yet either, so that counts as "not ready".
			const probe = main.querySelector("section, article");
			if ((!probe || !hydrated(probe)) && tries++ < 120) {
				setTimeout(() => !cancelled && setup(), 100);
				return;
			}
			run(main);
		};

		const run = (main: Element) => {
			ctx = gsap.context(() => {
			main.querySelectorAll<HTMLElement>("section, article > header").forEach((section) => {
				if (section.dataset.motion === "off" || section.closest('[data-motion="off"]')) return;
				const container = (Array.from(section.children).find((c) => c.tagName === "DIV" && !c.hasAttribute("aria-hidden")) as HTMLElement | undefined) ?? section;
				const blocks = Array.from(container.children).filter((el): el is HTMLElement => {
					if (!(el instanceof HTMLElement)) return false;
					if (el.tagName === "CANVAS" || el.getAttribute("aria-hidden") === "true") return false;
					const cs = getComputedStyle(el);
					return cs.position !== "sticky" && cs.position !== "fixed" && cs.display !== "none";
				});

				// Section-level scrub: in on the way up, receding on the way out. The first section is already on screen, so it only exits.
				const first = section === main.querySelector("section, article > header");
				gsap.set(container, { transformOrigin: "50% 0%" });
				if (!first) {
					gsap.fromTo(
						container,
						{ y: 90, scale: 0.965, autoAlpha: 0 },
						{
							y: 0,
							scale: 1,
							autoAlpha: 1,
							ease: "none",
							scrollTrigger: { trigger: section, start: "top 96%", end: "top 48%", scrub: 0.6 },
						},
					);
				}
				gsap.fromTo(
					container,
					{ y: 0, scale: 1, autoAlpha: 1 },
					{
						y: -80,
						scale: 0.975,
						autoAlpha: 0.12,
						ease: "none",
						immediateRender: false,
						scrollTrigger: { trigger: section, start: "bottom 58%", end: "bottom 6%", scrub: 0.6 },
					},
				);

				blocks.forEach((el) => {
					const self = el.matches(MARKED) || !!el.querySelector(MARKED);
					if (!self) {
						gsap.from(el, {
							autoAlpha: 0,
							y: 44,
							duration: 1,
							ease: "expo",
							scrollTrigger: { trigger: el, start: "top 90%", once: true },
						});
					}
				});
			});
			ScrollTrigger.refresh();
			}, main);
		};

		setup();
		return () => {
			cancelled = true;
			ctx?.revert();
		};
	}, [pathname]);

	return null;
}
