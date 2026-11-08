"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { createWordInk, fontReady, type WordInk } from "@/lib/ink-word";

/*
 * The last word of the hero headline, changing through what SM Chemicals makes. Each change is the site's liquid
 * reveal, the same ink as the loader, the menu and the page transitions (see lib/ink-word.ts): a noisy front sweeps
 * along the word, the new word soaks in behind it and the old one melts away ahead of it, the letters catching the
 * ink's glow where they overlap.
 *
 * The words are real text in the page (stacked in one grid cell, so the line is as wide as the longest and nothing
 * around it moves), which is what is read aloud, selected and shown before the script runs. Once the canvas has drawn
 * the word, the page text is made transparent and the canvas is what you see, at rest and in motion alike.
 * Reduced motion, or no WebGL, keeps the first word still. The colour is a tint of the brand blue picked for contrast
 * against the liquid behind (deep on the light ground, pale sky on the navy one).
 */
const HOLD_MS = 2600;
const SWEEP = 1.7;

const rgb = (css: string): [number, number, number] => {
	const m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(css);
	return m ? [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255] : [1, 1, 1];
};

export function RotatingWord({ words }: { words: string[] }) {
	const slot = useRef<HTMLSpanElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const root = slot.current;
		const cv = canvas.current;
		if (!root || !cv || words.length < 2) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const items = Array.from(root.querySelectorAll<HTMLElement>("[data-word]"));
		const probe = root.querySelector<HTMLElement>("[data-base]");
		if (!probe) return;

		let cancelled = false;
		let ink: WordInk | null = null;
		let current = 0;
		let timer = 0;
		let playing = false;
		let visible = true;
		let tween: gsap.core.Tween | null = null;

		const em = () => parseFloat(getComputedStyle(root).fontSize);
		// The canvas covers the stack plus the room the letters' tails and the full stop need.
		const PAD_Y = 0.3;
		const PAD_R = 0.14;
		const layout = () => {
			const r = root.getBoundingClientRect();
			const f = em();
			// Where the baseline is, measured from a zero-size inline box that sits on it.
			const base = probe.getBoundingClientRect().bottom - (r.top - f * PAD_Y);
			return { width: r.width + f * PAD_R, height: r.height + f * PAD_Y * 2, baseline: base };
		};
		const place = () => {
			cv.style.left = "0px";
			cv.style.top = `${-em() * PAD_Y}px`;
		};
		const font = () => {
			const cs = getComputedStyle(items[0]);
			return { weight: cs.fontWeight, family: cs.fontFamily, px: parseFloat(cs.fontSize), letterSpacing: parseFloat(cs.letterSpacing) || 0 };
		};
		const colors = () => {
			const word = rgb(getComputedStyle(root).color);
			const dark = document.documentElement.dataset.theme === "dark";
			// The glow along the front: white on the navy ground, the brand blue on the light one.
			ink?.setColors(word, dark ? [1, 1, 1] : [0, 0.45, 0.69]);
		};
		const draw = () => {
			colors();
			place();
			ink?.resize();
		};

		const settle = (index: number) => {
			ink?.setPair(words[index], words[index]);
			ink?.set(0);
			ink?.render();
		};

		const schedule = () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(next, HOLD_MS);
		};

		const next = () => {
			if (!ink || playing || !visible || document.hidden) return schedule();
			playing = true;
			const to = (current + 1) % words.length;
			items[current].setAttribute("aria-hidden", "true");
			items[to].removeAttribute("aria-hidden");
			ink.setPair(words[current], words[to]);
			const st = { t: 0 };
			tween = gsap.to(st, {
				t: 1,
				duration: SWEEP,
				ease: "power1.inOut",
				onUpdate: () => {
					ink?.set(st.t);
					ink?.render();
				},
				onComplete: () => {
					current = to;
					settle(current);
					playing = false;
					schedule();
				},
			});
		};

		// Wait for the fonts, so the canvas draws the same letters the page does, then take over from the page text.
		fontReady(items[0], words.join(" ")).then(() => {
			if (cancelled) return;
			ink = createWordInk(cv, { font, layout });
			if (!ink) return;
			draw();
			settle(0);
			items.forEach((el) => (el.style.color = "transparent"));
			// "inherit", not "visible": while the loader holds the hero text hidden, the canvas must stay hidden with it.
			cv.style.visibility = "inherit";
			timer = window.setTimeout(next, HOLD_MS + 1800);
		});

		const ro = new ResizeObserver(() => {
			if (!ink) return;
			draw();
			if (!playing) settle(current);
		});
		ro.observe(root);
		const onTheme = () => {
			if (!ink) return;
			colors();
			if (!playing) settle(current);
		};
		window.addEventListener("smc:theme", onTheme);
		const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
		io.observe(root);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
			tween?.kill();
			ro.disconnect();
			io.disconnect();
			window.removeEventListener("smc:theme", onTheme);
			items.forEach((el) => (el.style.color = ""));
			cv.style.visibility = "hidden";
			ink?.destroy();
		};
	}, [words]);

	return (
		<span ref={slot} className="relative inline-grid text-[#0a4f7c] [html[data-theme=dark]_&]:text-[#b4e2fb]" style={{ fontSize: fitSize(words) }}>
			{words.map((w, i) => (
				<span
					key={w}
					data-word
					aria-hidden={i === 0 ? undefined : true}
					className="col-start-1 row-start-1 whitespace-nowrap"
					style={{ opacity: i === 0 ? 1 : 0 }}
				>
					{w}
					{i === 0 && <i data-base aria-hidden className="inline-block h-0 w-0 align-baseline" />}
				</span>
			))}
			<canvas ref={canvas} aria-hidden className="pointer-events-none absolute" style={{ visibility: "hidden", width: 0, height: 0 }} />
		</span>
	);
}

/* Size the word to the screen: the longest word must fit the headline's width (the page's content width less its side
   padding), so on a phone the line steps down rather than running off the edge. Sora runs about 0.6em per character. */
function fitSize(words: string[]) {
	const longest = Math.max(...words.map((w) => w.length));
	return `min(1em, calc((min(100vw, 80rem) - 3.25rem) / ${(longest * 0.6).toFixed(2)}))`;
}
