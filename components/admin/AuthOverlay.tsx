"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createInk } from "@/lib/ink-gl";

/*
 * The moment between pressing Sign in (or Sign out) and the next page. It is the website's own opening animation, shortened:
 * the page is covered from the edges inward by the same liquid ground the loader uses, and then "SM Chemicals" inks in,
 * cut out of that ground and filled with the liquid. A line of words says what is happening. For reduced motion, or no
 * WebGL, it is the same two things, still: the name and the words on the ground.
 */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function AuthOverlay({ show, label }: { show: boolean; label: string }) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!show || !mounted) return null;
	return createPortal(<Cover label={label} />, document.body);
}

function Cover({ label }: { label: string }) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const [still, setStill] = useState(false);

	useEffect(() => {
		const el = canvas.current;
		if (!el) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setStill(true);
			return;
		}
		const dark = document.documentElement.dataset.theme === "dark";
		const ink = createInk(el, "reveal", {
			text: "SM Chemicals",
			font: getComputedStyle(el).fontFamily,
			textPx: () => Math.min(window.innerWidth * 0.115, 160),
			dark,
			ground: dark ? [0.043, 0.11, 0.157] : [0.933, 0.965, 0.984],
		});
		if (!ink) {
			setStill(true);
			return;
		}
		ink.draw(0.82, 0.5, 0.5);
		ink.setIn(0);
		ink.start();
		document.fonts?.ready.then(() => ink.refreshText());

		const t0 = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			const t = now - t0;
			// The ground closes in from the edges (the page is covered), then the name inks in from the left.
			ink.draw(0.82 * (1 - inOutCubic(clamp(t / 900))), 0.5, 0.5);
			ink.setIn(clamp((t - 500) / 1700));
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(raf);
			ink.destroy();
		};
	}, []);

	return (
		<div role="status" aria-live="polite" data-overlay data-surface="hero" className="font-heading fixed inset-0 z-3000 bg-background text-foreground">
			<canvas ref={canvas} aria-hidden className={`absolute inset-0 h-full w-full ${still ? "hidden" : ""}`} />
			{still && (
				<div className="absolute inset-0 flex items-center justify-center px-6">
					<span className="text-[clamp(2.5rem,11.5vw,10rem)] font-semibold tracking-[-0.03em] text-accent-ink">SM Chemicals</span>
				</div>
			)}
			<p className="absolute bottom-8 left-6 text-xl tracking-[-0.02em] text-foreground/80 sm:bottom-10 sm:left-10 sm:text-2xl">{label}…</p>
		</div>
	);
}
