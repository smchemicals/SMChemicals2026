"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { createWordInk, fontReady, type WordInk } from "@/lib/ink-word";

/*
 * A short, big word made of the site's liquid, for status pages ("404"). It inks in from the left along a noisy front
 * when the page opens, and every so often melts away and soaks back in, the same reveal as the hero's changing word
 * (lib/ink-word.ts). The text is real text in the page (what is read aloud, and shown without WebGL or with reduced
 * motion); it is hidden only while the canvas is the one drawing it.
 */
const SWEEP = 1.7;
const EVERY_MS = 7000;

const rgb = (css: string): [number, number, number] => {
	const m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(css);
	return m ? [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255] : [0.4, 0.7, 0.9];
};

export function LiquidCode({ text, className = "" }: { text: string; className?: string }) {
	const slot = useRef<HTMLSpanElement>(null);
	const word = useRef<HTMLSpanElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const root = slot.current;
		const w = word.current;
		const cv = canvas.current;
		const probe = root?.querySelector<HTMLElement>("[data-base]");
		if (!root || !w || !cv || !probe) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			w.style.color = "";
			return;
		}
		// Hidden from the first frame of every run of this effect (the cleanup below shows it again, and React may run the
		// effect twice in development), so the page text is never seen under the canvas drawing the same word.
		w.style.color = "transparent";
		let cancelled = false;
		let ink: WordInk | null = null;
		let timer = 0;
		let playing = false;
		let visible = true;
		let tween: gsap.core.Timeline | null = null;
		const PAD_Y = 0.3;
		const PAD_X = 0.12;

		const em = () => parseFloat(getComputedStyle(root).fontSize);
		const layout = () => {
			const r = root.getBoundingClientRect();
			const f = em();
			return { width: r.width + f * PAD_X * 2, height: r.height + f * PAD_Y * 2, baseline: probe.getBoundingClientRect().bottom - (r.top - f * PAD_Y) };
		};
		const font = () => {
			const cs = getComputedStyle(w);
			return { weight: cs.fontWeight, family: cs.fontFamily, px: parseFloat(cs.fontSize), letterSpacing: parseFloat(cs.letterSpacing) || 0 };
		};
		const colors = () => {
			const dark = document.documentElement.dataset.theme === "dark";
			ink?.setColors(rgb(getComputedStyle(root).color), dark ? [1, 1, 1] : [0, 0.45, 0.69]);
		};
		const place = () => {
			cv.style.left = `${-em() * PAD_X}px`;
			cv.style.top = `${-em() * PAD_Y}px`;
		};
		const draw = () => {
			colors();
			place();
			ink?.resize();
		};
		const still = (blank: boolean) => {
			ink?.setPair(blank ? "" : text, blank ? "" : text);
			ink?.set(0);
			ink?.render();
		};

		const run = (legs: [string, string][], then: () => void) => {
			if (!ink) return;
			playing = true;
			const e = ink;
			tween = gsap.timeline({
				onComplete: () => {
					playing = false;
					still(false);
					then();
				},
			});
			legs.forEach(([a, b], n) => {
				const st = { t: 0 };
				tween!.call(() => e.setPair(a, b));
				tween!.to(st, { t: 1, duration: SWEEP, ease: "power1.inOut", onUpdate: () => (e.set(st.t), e.render()) }, n === 0 ? undefined : ">");
			});
		};

		const loop = () => {
			timer = window.setTimeout(() => {
				if (!ink || playing || !visible || document.hidden) return loop();
				run([[text, ""], ["", text]], loop);
			}, EVERY_MS);
		};

		fontReady(w, text).then(() => {
			if (cancelled) return;
			ink = createWordInk(cv, { font, layout });
			if (!ink) {
				w.style.color = "";
				return;
			}
			draw();
			still(true);
			cv.style.visibility = "visible";
			// The first time: it inks in.
			run([["", text]], loop);
		});

		const ro = new ResizeObserver(() => {
			if (!ink) return;
			draw();
			if (!playing) still(false);
		});
		ro.observe(root);
		const onTheme = () => {
			if (!ink) return;
			colors();
			if (!playing) still(false);
		};
		window.addEventListener("smc:theme", onTheme);
		const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
		io.observe(root);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
			tween?.kill();
			ro.disconnect();
			io.disconnect();
			window.removeEventListener("smc:theme", onTheme);
			w.style.color = "";
			cv.style.visibility = "hidden";
			ink?.destroy();
		};
	}, [text]);

	return (
		<span ref={slot} className={`relative inline-block ${className}`}>
			{/* Transparent until the canvas is drawing it (the effect restores it if there is no WebGL or motion is reduced). */}
			<span ref={word} className="whitespace-nowrap" style={{ color: "transparent" }}>
				{text}
				<i data-base aria-hidden className="inline-block h-0 w-0 align-baseline" />
			</span>
			<canvas ref={canvas} aria-hidden className="pointer-events-none absolute" style={{ visibility: "hidden", width: 0, height: 0 }} />
		</span>
	);
}
