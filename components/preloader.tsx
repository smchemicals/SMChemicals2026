"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { createInk } from "@/lib/ink-gl";
import { readVisit, rememberVisit } from "@/lib/storage";

const KEY = "smc:intro";

/*
 * The opening moment. The page starts on the light ground; as it loads, a hole
 * with a liquid edge opens and the real hero background shows through it,
 * growing until the light is gone and the hero is simply there. The loader is
 * the hero background arriving. It plays once per visit in production, on every
 * load in development (and never for reduced motion), and holds the page's
 * animations until the hole has opened, so the hero's entrance is seen. Add
 * ?intro to the address to replay it.
 */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// The count's pace: quick off the line, a considered middle, a confident finish. Smoothly interpolated, never jerky.
const PACE: [number, number][] = [
	[0, 0],
	[0.2, 0.16],
	[0.45, 0.34],
	[0.72, 0.78],
	[1, 1],
];
function pace(t: number) {
	for (let i = 1; i < PACE.length; i++) {
		const [t1, v1] = PACE[i];
		if (t <= t1) {
			const [t0, v0] = PACE[i - 1];
			return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0));
		}
	}
	return 1;
}

const COUNT_MS = 2500; // 0 to 100
const REVEAL_AT = 0.5; // the hole starts opening halfway through the count
const REVEAL_MS = 1900;
export function Preloader() {
	const [phase, setPhase] = useState<"on" | "leaving" | "off">("on");
	const canvas = useRef<HTMLCanvasElement>(null);
	const root = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let skip = false;
		try {
			const forced = new URLSearchParams(window.location.search).has("intro");
			const inDev = process.env.NODE_ENV !== "production";
			// A shared link to a chemical goes straight to it. The opening animation would play first, with the chemical already
			// opened behind it, and then start the chemical's own entrance all over again as the loader lifts.
			const toChemical = new URLSearchParams(window.location.search).has("product");
			skip = !forced && (toChemical || (!inDev && readVisit(KEY) === "1"));
		} catch {}
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) skip = true;
		const el = canvas.current;
		const dark = document.documentElement.dataset.theme === "dark";
		const pad = () => (window.innerWidth >= 640 ? 40 : 24);
		const counterPx = () => Math.min(Math.max(56, window.innerWidth * 0.09), 128);
		const ink = el
			? createInk(el, "reveal", {
					text: "SM Chemicals",
					font: getComputedStyle(el).fontFamily,
					textPx: () => Math.min(window.innerWidth * 0.115, 160),
					counter: { px: counterPx, left: pad, bottom: () => 18 },
					dark,
					ground: dark ? [0.043, 0.110, 0.157] : [0.933, 0.965, 0.984],
				})
			: null;
		if (skip || !ink) {
			ink?.destroy();
			setPhase("off");
			return;
		}
		rememberVisit(KEY, "1");

		// Hold every page animation until the hole is nearly open, with the hero text kept hidden (see globals.css).
		const root_ = document.documentElement;
		root_.classList.add("intro-hold");
		gsap.globalTimeline.pause();
		root_.style.overflow = "hidden";

		// The hole opens from the lower right, so the count at the lower left stays on the light ground longest.
		const OX = 0.86;
		const OY = 0.84;

		let ready = false;
		let released = false;
		let done = false;
		// ?intro=4 plays it four times slower, to look at it closely.
		const slow = Math.max(1, Number(new URLSearchParams(window.location.search).get("intro")) || 1);
		const start = performance.now();
		// Ready means fonts are in and the page has painted. Not the window "load" event,
		// which in development can wait a long time on things that don't matter here.
		Promise.all([
			document.fonts?.ready ?? Promise.resolve(),
			new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
		]).then(() => {
			ready = true;
			ink.refreshText();
		});

		const release = () => {
			if (released) return;
			released = true;
			gsap.globalTimeline.resume();
			root_.style.overflow = "";
			// Release the CSS hold only after the page's own animation has taken over, so the text never flashes.
			requestAnimationFrame(() => requestAnimationFrame(() => root_.classList.remove("intro-hold")));
			setPhase("leaving");
		};

		const finish = () => {
			if (done) return;
			done = true;
			release();
			ink.stop();
			setTimeout(() => setPhase("off"), 60);
		};

		let raf = 0;
		let countT = 0; // 0..1 progress of the count itself
		const tick = (now: number) => {
			const t = (now - start) / slow;
			if (!ready && t > 4500) ready = true; // never wait forever
			// One smooth run. If the page isn't ready yet it holds near the end rather than stalling early.
			const rawT = clamp(t / COUNT_MS);
			countT = ready ? rawT : Math.min(rawT, 0.9);
			ink.setCounter(pace(countT) * 100);


			// The hole follows the count: it begins halfway through and keeps its own smooth curve.
			const rr = ready ? clamp((t - COUNT_MS * REVEAL_AT) / REVEAL_MS) : Math.min(clamp((t - COUNT_MS * REVEAL_AT) / REVEAL_MS), 0.55);
			const hole = rr >= 1 ? 1 : 0.82 * inOutCubic(rr);
			ink.draw(hole, OX, OY);

			// The name inks in from the left along a noisy front; the hole then eats it and the count like the rest of the ground.
			ink.setIn(clamp((t - 150) / 1700), clamp(t / 1400));

			// Hand the page back just before the hole finishes, so the hero's entrance overlaps the last of the reveal.
			if (rr >= 0.86) release();
			if (rr >= 1) {
				finish();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		ink.setCounter(0);
		ink.draw(0, OX, OY);
		ink.start();
		// The light cover is in the markup from the start; hand it to the canvas once the shader has drawn.
		requestAnimationFrame(() => requestAnimationFrame(() => root.current?.style.setProperty("background-color", "transparent")));
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			ink.destroy();
			if (!done) {
				gsap.globalTimeline.resume();
				root_.style.overflow = "";
				root_.classList.remove("intro-hold");
			}
		};
	}, []);

	if (phase === "off") return null;

	return (
		<div
			ref={root}
			role="status"
			data-overlay
			data-surface="hero"
			aria-label="Loading"
			aria-hidden={phase === "leaving"}
			className={`font-heading fixed inset-0 z-3000 bg-background ${phase === "on" ? "" : "pointer-events-none"}`}
		>
			<canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
		</div>
	);
}
