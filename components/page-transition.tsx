"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/smooth-scroll";
import { createInk, type Ink } from "@/lib/ink-gl";

const SPREAD_MS = 1000;
const HANDOFF_MS = 520;
// The route starts loading while the ink is still spreading, so the page is ready by the time it has covered the screen.
const PUSH_AT = 0.4;
// How long the page's pieces get to leave before the ink starts spreading.
const EXIT_LEAD_MS = 300;
// Parts of the site that should navigate normally, with no transition.
const SKIP_PREFIXES = ["/admin", "/api", "/preview"];

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* Animate a value from a to b over ms (plain rAF, so it keeps running while the page's own animations are held). */
function tween(a: number, b: number, ms: number, onUpdate: (v: number) => void, onDone: () => void) {
	const t0 = performance.now();
	const step = (now: number) => {
		const k = Math.min(1, (now - t0) / ms);
		onUpdate(a + (b - a) * easeInOut(k));
		if (k < 1) requestAnimationFrame(step);
		else onDone();
	};
	requestAnimationFrame(step);
}

/* The things on screen that should leave, in reading order: marked elements first, headings and text for sections that aren't marked. */
function leaving(): HTMLElement[] {
	const main = document.querySelector("main");
	if (!main) return [];
	const all = Array.from(main.querySelectorAll<HTMLElement>("[data-reveal], [data-line], [data-in], h1, h2, h3, section p, section li, section dl > div"));
	const inView = all.filter((el) => {
		const r = el.getBoundingClientRect();
		return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
	});
	// Keep the outermost only, so a card and the text inside it don't animate twice.
	return inView.filter((el) => !inView.some((o) => o !== el && o.contains(el)));
}

/*
 * Page to page, one motion, the same as opening the menu: the site's ink spreads out from the point you
 * clicked until it covers the page, and that is the whole transition. The ink is the colour of the ground the
 * next page opens on (navy or ice, following the theme), so when the new page is in it simply hands over and
 * the page's own entrance plays. Nothing runs backwards and nothing plays twice.
 */
export function PageTransition() {
	const router = useRouter();
	const pathname = usePathname();
	const canvas = useRef<HTMLCanvasElement>(null);
	const ink = useRef<Ink | null>(null);
	const pending = useRef<string | null>(null);
	const busy = useRef(false);
	const covered = useRef(false);
	const routeIn = useRef(false);
	const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const el = canvas.current;
		if (!el) return;
		const i = createInk(el);
		if (!i) return;
		ink.current = i;
		return () => {
			i.destroy();
			ink.current = null;
		};
	}, []);

	const show = (on: boolean) => {
		const el = canvas.current;
		if (!el) return;
		el.style.transition = "none";
		el.style.opacity = "1";
		el.style.visibility = on ? "visible" : "hidden";
	};

	// The new page is mounted under the cover: start it at the top, let its entrance play, and hand over by dissolving the ink.
	const handOver = () => {
		if (!busy.current) return;
		if (safety.current) clearTimeout(safety.current);
		pending.current = null;
		getLenis()?.scrollTo(0, { immediate: true });
		window.scrollTo(0, 0);
		gsap.globalTimeline.resume();
		const el = canvas.current;
		if (!el) return;
		el.style.transition = `opacity ${HANDOFF_MS}ms ease-out`;
		el.style.opacity = "0";
		setTimeout(() => {
			ink.current?.stop();
			show(false);
			busy.current = false;
		}, HANDOFF_MS + 40);
	};

	// Hand over once the ink has covered the page AND the new route is mounted under it.
	const tryHandOver = () => {
		if (!busy.current || !covered.current || !routeIn.current) return;
		setTimeout(handOver, 220);
	};

	useEffect(() => {
		if (!pending.current || pathname !== pending.current.split(/[?#]/)[0]) return;
		routeIn.current = true;
		tryHandOver();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	useEffect(() => {
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

		const onClick = (e: MouseEvent) => {
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			if (reduce.matches || busy.current || !ink.current) return;
			// Let the opening preloader finish first.
			if (document.querySelector('[role="status"][aria-label="Loading"]')) return;

			const a = (e.target as Element | null)?.closest?.("a");
			if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
			const url = new URL(a.href, window.location.href);
			if (url.origin !== window.location.origin) return;
			if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p))) return;
			// Same page, or only a hash on this page: nothing to transition.
			if (url.pathname === window.location.pathname && url.search === window.location.search) return;

			e.preventDefault();
			busy.current = true;
			covered.current = false;
			routeIn.current = false;
			const target = url.pathname + url.search + url.hash;
			pending.current = target;

			// Spread from the click; keyboard activation reports 0,0, so use the link's centre.
			let cx = e.clientX;
			let cy = e.clientY;
			if (e.detail === 0 || (cx === 0 && cy === 0)) {
				const r = a.getBoundingClientRect();
				cx = r.left + r.width / 2;
				cy = r.top + r.height / 2;
			}
			const x = cx / window.innerWidth;
			const y = 1 - cy / window.innerHeight;

			// What is on screen leaves one piece after another (plain Web Animations, so pausing the page's timeline doesn't stop it).
			leaving().forEach((el, i) =>
				el.animate(
					[
						{ opacity: 1, transform: "translateY(0)" },
						{ opacity: 0, transform: "translateY(-22px)" },
					],
					{ duration: 420, delay: Math.min(i * 34, 300), easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
				),
			);
			gsap.globalTimeline.pause();
			ink.current.setInverted(false);
			ink.current.setTone(null);
			// The page's pieces leave first; the ink follows a beat behind, so the exit is seen before the page is covered.
			setTimeout(() => {
				if (!ink.current) return;
				show(true);
				ink.current.draw(0, x, y);
				ink.current.start();
				runSpread();
			}, EXIT_LEAD_MS);
			let pushed = false;
			const runSpread = () => tween(
				0,
				1,
				SPREAD_MS,
				(p) => {
					ink.current?.draw(p, x, y);
					if (!pushed && p >= PUSH_AT) {
						pushed = true;
						router.push(target);
					}
				},
				() => {
					covered.current = true;
					tryHandOver();
					// Never leave the page covered if the route stalls.
					safety.current = setTimeout(handOver, 5000);
				},
			);
		};

		document.addEventListener("click", onClick, true);
		return () => document.removeEventListener("click", onClick, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router]);

	return (
		<canvas
			ref={canvas}
			aria-hidden
			data-surface="hero"
			className="pointer-events-none fixed inset-0 z-950 h-full w-full"
			style={{ visibility: "hidden" }}
		/>
	);
}
