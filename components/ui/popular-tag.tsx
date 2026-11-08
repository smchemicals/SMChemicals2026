"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { addTag } from "@/lib/popular-ink";
import { fontReady } from "@/lib/ink-word";

/*
 * The "Popular" mark on an industry (set per industry in the admin), the same everywhere it appears. Every so often the
 * word melts into the next through the site's liquid, the same reveal as the hero's changing word; the tags take turns,
 * so only one moves at a time (lib/popular-ink.ts). The words are real text, which is what is read aloud and shown
 * before the script runs, and what is shown for reduced motion.
 */
const WORDS = ["Popular"];

// The canvas is created before it has been sized (it is sized when the tag first changes), and a canvas with no size is 300 by
// 150 pixels. Hidden or not, that box sticks out to the right of a tag near the screen edge and makes the whole page scroll
// sideways on a phone, which also throws the fixed header off the screen. So it starts at no size at all.

export function PopularTag({ className }: { className?: string }) {
	const root = useRef<HTMLSpanElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const r = root.current;
		const c = canvas.current;
		const probe = r?.querySelector<HTMLElement>("[data-base]");
		if (!r || !c || !probe) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let remove = () => {};
		let gone = false;
		// Add the tag once its exact font face is loaded, so the canvas never draws it in a fallback.
		fontReady(r, WORDS.join(" ")).then(() => {
			if (!gone) remove = addTag({ root: r, canvas: c, probe, words: WORDS, at: 0, visible: false, painted: false });
		});
		return () => {
			gone = true;
			remove();
			c.style.visibility = "hidden";
			r.querySelectorAll<HTMLElement>("[data-word]").forEach((w) => (w.style.color = ""));
		};
	}, []);

	return (
		<span className={cn("relative inline-block rounded-md bg-cta px-2.5 py-1 text-sm font-semibold leading-none text-cta-foreground", className)}>
			<span ref={root} className="relative inline-grid">
				{WORDS.map((w, i) => (
					<span key={w} data-word aria-hidden={i === 0 ? undefined : true} className="col-start-1 row-start-1 whitespace-nowrap" style={{ opacity: i === 0 ? 1 : 0 }}>
						{w}
						{i === 0 && <i data-base aria-hidden className="inline-block h-0 w-0 align-baseline" />}
					</span>
				))}
				<canvas ref={canvas} aria-hidden className="pointer-events-none absolute" style={{ visibility: "hidden", width: 0, height: 0 }} />
			</span>
		</span>
	);
}
