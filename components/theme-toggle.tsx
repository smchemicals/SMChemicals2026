"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { remember } from "@/lib/storage";

type Theme = "light" | "dark";

/* An irregular, softly feathered blob (a closed shape whose radius wobbles), used as the reveal's mask. */
let blobUrl: string | null = null;
function blobMask(): string {
	if (blobUrl) return blobUrl;
	const c = document.createElement("canvas");
	c.width = c.height = 512;
	const ctx = c.getContext("2d");
	if (!ctx) return "";
	const soft = ctx as CanvasRenderingContext2D & { filter?: string };
	soft.filter = "blur(5px)";
	ctx.fillStyle = "#000";
	ctx.beginPath();
	for (let i = 0; i <= 360; i++) {
		const t = (i / 360) * Math.PI * 2;
		const rad = 150 * (1 + 0.12 * Math.sin(3 * t + 1.3) + 0.09 * Math.sin(5 * t + 0.4) + 0.06 * Math.sin(7 * t + 2.1) + 0.04 * Math.sin(11 * t));
		const px = 256 + Math.cos(t) * rad;
		const py = 256 + Math.sin(t) * rad;
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
	ctx.fill();
	blobUrl = c.toDataURL("image/png");
	return blobUrl;
}

/*
 * Light or dark, a plain text control. The choice is remembered only if the visitor has allowed storage (lib/storage.ts); otherwise the page follows the
 * system (see the script in app/layout.tsx). It names what it will switch to. The change is a single reveal:
 * the new theme grows out of the toggle through a liquid-edged blob (the browser's view transition, masked),
 * and an open menu closes with it. Browsers without view transitions, or reduced motion, just switch.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
	const [theme, setTheme] = useState<Theme | null>(null);
	// For a moment after a switch the label says what is now on ("Light theme on"), so the change is plain to see even where
	// nothing around the toggle changes colour (the home page's footer is the brand blue in both themes).
	const [flash, setFlash] = useState<Theme | null>(null);
	const swatch = useRef<HTMLSpanElement>(null);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		const read = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
		read();
		window.addEventListener("smc:theme", read);
		return () => window.removeEventListener("smc:theme", read);
	}, []);

	const apply = (next: Theme) => {
		// Colours must change in one step. With the usual hover transitions running, every link and label would fade from its
		// old colour inside the revealed area, which reads as a flicker. The class is lifted once the change has settled.
		document.documentElement.classList.add("theme-switching");
		document.documentElement.dataset.theme = next;
		remember("smc:theme", next);
		// Rendered now, not later, so the new label is part of what the reveal shows.
		flushSync(() => {
			setTheme(next);
			setFlash(next);
		});
		// The little half-and-half dial turns to its new side. (An animation, not a transition: transitions are held off while
		// the theme switches.)
		swatch.current?.animate(
			[{ transform: `rotate(${next === "dark" ? 0 : 180}deg) scale(1)` }, { transform: `rotate(${next === "dark" ? 180 : 360}deg) scale(1)` }],
			{ duration: 1100, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
		);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setFlash(null), 2600);
		window.dispatchEvent(new Event("smc:theme"));
		window.dispatchEvent(new Event("smc:close-menu"));
	};
	const settle = () => document.documentElement.classList.remove("theme-switching");

	const flip = (e: React.MouseEvent<HTMLButtonElement>) => {
		const next: Theme = theme === "dark" ? "light" : "dark";
		const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
		if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			apply(next);
			requestAnimationFrame(() => requestAnimationFrame(settle));
			return;
		}
		const r = e.currentTarget.getBoundingClientRect();
		const x = r.left + r.width / 2;
		const y = r.top + r.height / 2;
		const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
		// The blob's thinnest radius is about a fifth of its image, so size it to clear the farthest corner.
		const size = reach * 5.2;
		document.documentElement.style.setProperty("--smc-blob", `url(${blobMask()})`);
		const vt = doc.startViewTransition(() => apply(next));
		vt.ready
			.then(() => {
				// "forwards" matters: without it the mask snaps back to nothing the instant the animation ends, and for a frame
				// before the transition is torn down the old theme shows again, which is the flash at the end.
				// One reveal: the new theme grows out of the toggle through a liquid-edged blob, like the menu's ink.
				document.documentElement.animate(
					{
						maskSize: ["0px 0px", `${size}px ${size}px`],
						maskPosition: [`${x}px ${y}px`, `${x - size / 2}px ${y - size / 2}px`],
					},
					{ duration: 1300, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards", pseudoElement: "::view-transition-new(root)" },
				);
			})
			.catch(() => {});
		vt.finished.finally(settle);
	};

	useEffect(() => () => clearTimeout(timer.current), []);

	const other: Theme = theme === "dark" ? "light" : "dark";
	const showing = flash ? `on-${flash}` : `to-${other}`;

	return (
		<>
			<button
				type="button"
				onClick={flip}
				aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
				className={`inline-flex cursor-pointer items-center gap-2.5 outline-none transition-colors duration-300 focus-visible:text-accent-ink ${className}`}
			>
				{theme !== null && (
					<span
						ref={swatch}
						aria-hidden
						className="relative block h-[0.95em] w-[0.95em] shrink-0 overflow-hidden rounded-full ring-[1.5px] ring-current"
						style={{ transform: `rotate(${theme === "dark" ? 180 : 0}deg)` }}
					>
						<span className="absolute inset-y-0 left-0 w-1/2 bg-current" />
					</span>
				)}
				{/* Both words sit in one cell, so the button never changes size; the one that applies is the one you see. */}
				<span aria-hidden className="grid">
					{theme === null
						? " "
						: [`to-light`, `to-dark`, `on-light`, `on-dark`].map((key) => (
								<span key={key} className={`col-start-1 row-start-1 whitespace-nowrap transition-opacity duration-500 ${showing === key ? "opacity-100" : "opacity-0"}`}>
									{key === "to-light" ? "Switch to light" : key === "to-dark" ? "Switch to dark" : key === "on-light" ? "Light theme on" : "Dark theme on"}
								</span>
							))}
				</span>
			</button>
			<span role="status" aria-live="polite" className="sr-only">
				{flash ? `${flash === "dark" ? "Dark" : "Light"} theme on` : ""}
			</span>
		</>
	);
}
