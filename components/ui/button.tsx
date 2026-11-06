"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createInk, type Ink } from "@/lib/ink-gl";

/*
 * The one button. Every button on the site is this: the same shape, type and
 * hover. On hover the site's own ink (the same shader as the menu and the page
 * transition) spreads out from the pointer in the button's fill colour, and is eaten away
 * from the point you leave by; the arrow nudges. Four variants, three sizes.
 *
 *   primary  brand blue; fills with the page's ink (works on light and navy grounds)
 *   light    white; for navy and blue grounds
 *   dark     navy; for light grounds
 *   outline  hairline ring; fills with the page's ink
 */
export type ButtonVariant = "primary" | "light" | "dark" | "outline";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonArrow = "right" | "up-right" | "down";

const SIZES: Record<ButtonSize, string> = {
	sm: "h-11 px-5 text-[0.9375rem]",
	md: "h-12 px-6 text-[1.0625rem]",
	lg: "h-14 px-8 text-lg",
};

const VARIANTS: Record<ButtonVariant, { base: string; fill: string; label: string }> = {
	primary: {
		base: "bg-cta text-cta-foreground",
		fill: "bg-foreground",
		label: "group-hover/btn:text-background group-focus-visible/btn:text-background",
	},
	light: { base: "bg-white text-deep", fill: "bg-sky", label: "" },
	dark: { base: "bg-deep text-white", fill: "bg-accent", label: "" },
	outline: {
		base: "text-foreground ring-1 ring-inset ring-foreground/30",
		fill: "bg-foreground",
		label: "group-hover/btn:text-background group-focus-visible/btn:text-background",
	},
};

const ARROW_MOTION: Record<ButtonArrow, string> = {
	right: "group-hover/btn:translate-x-1",
	"up-right": "group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5",
	down: "group-hover/btn:translate-y-1",
};
const ARROW_ICON = { right: ArrowRight, "up-right": ArrowUpRight, down: ArrowDown } as const;

type Common = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	arrow?: ButtonArrow;
	className?: string;
	children?: React.ReactNode;
};

export function buttonClass({ variant = "primary", size = "md", className }: Pick<Common, "variant" | "size" | "className">) {
	return cn(
		"group/btn relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-md font-heading font-semibold tracking-[-0.02em] outline-none",
		"focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"disabled:cursor-wait disabled:opacity-60",
		SIZES[size],
		VARIANTS[variant].base,
		className,
	);
}

/*
 * The ink behind the hover. A few WebGL canvases are shared by every button (one context each, created on demand);
 * the one in use is moved inside the hovered button, under its label, and drawn in the button's fill colour.
 */
type Slot = { canvas: HTMLCanvasElement; ink: Ink; busy: boolean };
const pool: Slot[] = [];
const MAX_SLOTS = 4;

function acquire(): Slot | null {
	const free = pool.find((x) => !x.busy);
	if (free) return free;
	if (pool.length >= MAX_SLOTS) return null;
	const canvas = document.createElement("canvas");
	canvas.setAttribute("aria-hidden", "true");
	canvas.className = "pointer-events-none absolute inset-0 h-full w-full";
	const ink = createInk(canvas);
	if (!ink) return null;
	const slot = { canvas, ink, busy: false };
	pool.push(slot);
	return slot;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function tween(a: number, b: number, ms: number, onUpdate: (v: number) => void, onDone: () => void, alive: () => boolean) {
	const t0 = performance.now();
	const step = (now: number) => {
		if (!alive()) return;
		const k = Math.min(1, (now - t0) / ms);
		onUpdate(a + (b - a) * easeInOut(k));
		if (k < 1) requestAnimationFrame(step);
		else onDone();
	};
	requestAnimationFrame(step);
}

function rgbOf(el: Element): [number, number, number] {
	const m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(getComputedStyle(el).backgroundColor);
	return m ? [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255] : [0, 0.45, 0.69];
}

function useFill<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	const live = useRef<{ slot: Slot; p: number; token: number } | null>(null);
	const token = useRef(0);

	const probe = () => ref.current?.querySelector<HTMLElement>("[data-fill]") ?? null;

	const start = (cx: number | null, cy: number | null) => {
		const el = ref.current;
		const pr = probe();
		if (!el || !pr) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			pr.style.opacity = "1";
			return;
		}
		const mine = ++token.current;
		const slot = live.current?.slot ?? acquire();
		if (!slot) {
			// No spare canvas (or no WebGL): a plain fill, so the label never sits on nothing.
			pr.style.opacity = "1";
			return;
		}
		slot.busy = true;
		const r = el.getBoundingClientRect();
		const x = cx === null ? 0.5 : (cx - r.left) / r.width;
		const y = cy === null ? 0.5 : 1 - (cy - r.top) / r.height;
		if (slot.canvas.parentElement !== el) el.insertBefore(slot.canvas, el.firstChild);
		slot.ink.setInverted(false);
		slot.ink.setTint(rgbOf(pr));
		slot.ink.draw(0, x, y);
		slot.ink.start();
		const state = { slot, p: 0, token: mine };
		live.current = state;
		tween(0, 1, 650, (p) => {
			state.p = p;
			slot.ink.draw(p, x, y);
		}, () => {}, () => token.current === mine);
	};

	const stop = (cx: number | null, cy: number | null) => {
		const el = ref.current;
		const pr = probe();
		if (pr) pr.style.opacity = "";
		const state = live.current;
		if (!el || !state) return;
		const mine = ++token.current;
		const { slot } = state;
		const done = () => {
			if (token.current !== mine) return;
			slot.ink.stop();
			slot.canvas.remove();
			slot.busy = false;
			live.current = null;
		};
		const r = el.getBoundingClientRect();
		const x = cx === null ? 0.5 : (cx - r.left) / r.width;
		const y = cy === null ? 0.5 : 1 - (cy - r.top) / r.height;
		if (state.p >= 0.98) {
			// Fully filled: the ink is eaten away outward from where you left, so it only ever moves forward.
			slot.ink.setInverted(true);
			slot.ink.draw(0, x, y);
			tween(0, 1, 520, (p) => slot.ink.draw(p, x, y), done, () => token.current === mine);
		} else {
			// Left mid-spread: draw it back from its current extent.
			const from = state.p;
			tween(from, 0, 260, (p) => slot.ink.draw(p, x, y), done, () => token.current === mine);
		}
	};

	return {
		ref,
		onPointerEnter: (e: React.PointerEvent) => start(e.clientX, e.clientY),
		onPointerLeave: (e: React.PointerEvent) => stop(e.clientX, e.clientY),
		onFocus: (e: React.FocusEvent) => {
			if (e.currentTarget.matches(":focus-visible")) start(null, null);
		},
		onBlur: () => stop(null, null),
	};
}

function Body({ variant = "primary", arrow, children }: Pick<Common, "variant" | "arrow" | "children">) {
	const v = VARIANTS[variant];
	const Icon = arrow ? ARROW_ICON[arrow] : null;
	return (
		<>
			{/* The fill colour for the ink to read; it is only shown itself when there is no ink (reduced motion, no WebGL). */}
			<span aria-hidden data-fill className={cn("pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300", v.fill)} />
			<span className={cn("relative z-10 inline-flex min-w-0 max-w-full items-center gap-2.5 transition-colors duration-300", v.label)}>
				{children}
				{Icon && (
					<Icon
						aria-hidden
						strokeWidth={2.25}
						className={cn("h-[1.125em] w-[1.125em] shrink-0 transition-transform duration-300", ARROW_MOTION[arrow!])}
					/>
				)}
			</span>
		</>
	);
}

export function Button({
	variant,
	size,
	arrow,
	className,
	children,
	type = "button",
	...rest
}: Common & Omit<React.ComponentProps<"button">, keyof Common>) {
	const fill = useFill<HTMLButtonElement>();
	return (
		<button type={type} {...fill} className={buttonClass({ variant, size, className })} {...rest}>
			<Body variant={variant} arrow={arrow}>
				{children}
			</Body>
		</button>
	);
}

export function ButtonLink({
	variant,
	size,
	arrow,
	className,
	children,
	href,
	...rest
}: Common & { href: string } & Omit<React.ComponentProps<typeof Link>, keyof Common | "href">) {
	const fill = useFill<HTMLAnchorElement>();
	return (
		<Link href={href} {...fill} className={buttonClass({ variant, size, className })} {...rest}>
			<Body variant={variant} arrow={arrow}>
				{children}
			</Body>
		</Link>
	);
}

export function ButtonAnchor({
	variant,
	size,
	arrow,
	className,
	children,
	...rest
}: Common & Omit<React.ComponentProps<"a">, keyof Common>) {
	const fill = useFill<HTMLAnchorElement>();
	return (
		<a {...fill} className={buttonClass({ variant, size, className })} {...rest}>
			<Body variant={variant} arrow={arrow}>
				{children}
			</Body>
		</a>
	);
}
