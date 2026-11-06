"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { createInk, type Ink } from "@/lib/ink-gl";
import { useActive, useGroups } from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/app/admin/auth-actions";

/*
 * The menu on phones and tablets, moving the way the website's own menu moves. Opening spreads the same liquid ink out from
 * the Menu button until it covers the screen, then the entries rise one after another through their masks and the account
 * block fades up. Closing plays the same timeline backwards, a little faster. "Close" sits exactly where "Menu" was, so the
 * button seems to change its word. Picking a page starts that same closing at once, so the ink draws back and shows the new
 * page arriving; Escape and Close do the same. Reduced motion skips straight to the end.
 */
export function AdminMobileMenu({ permissions, email, role }: { permissions: string[]; email: string; role: string }) {
	const groups = useGroups(permissions);
	const active = useActive();
	const path = usePathname();
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const sheet = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const closeBtn = useRef<HTMLButtonElement>(null);
	const opener = useRef<HTMLButtonElement>(null);
	const ink = useRef<Ink | null>(null);
	const tl = useRef<gsap.core.Timeline | null>(null);

	useEffect(() => setMounted(true), []);

	// One small WebGL context for the ink. It only draws while the menu is moving or open.
	useEffect(() => {
		if (!mounted || !canvas.current) return;
		const gl = createInk(canvas.current);
		ink.current = gl;
		return () => {
			gl?.destroy();
			ink.current = null;
		};
	}, [mounted]);

	useEffect(() => {
		const menu = sheet.current;
		const trigger = opener.current;
		if (!mounted || !menu || !trigger) return;

		if (open) {
			const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			const r = trigger.getBoundingClientRect();
			const ox = (r.left + r.width / 2) / window.innerWidth;
			const oy = 1 - (r.top + r.height / 2) / window.innerHeight;
			const prog = { v: 0 };
			tl.current?.kill();
			document.body.style.overflow = "hidden";
			menu.style.visibility = "visible";
			ink.current?.draw(0, ox, oy);
			ink.current?.start();
			const t = gsap.timeline({
				onReverseComplete: () => {
					menu.style.visibility = "hidden";
					ink.current?.stop();
					document.body.style.overflow = "";
					opener.current?.focus();
				},
			});
			t.to(prog, { v: 1, duration: 1.1, ease: "power2.inOut", onUpdate: () => ink.current?.draw(prog.v, ox, oy) })
				.fromTo(menu.querySelectorAll("[data-menu-line]"), { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.035, ease: "expoOut" }, 0.5)
				.fromTo(menu.querySelectorAll("[data-menu-fade]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "expoOut" }, 0.75);
			if (reduce) t.timeScale(20);
			tl.current = t;
			closeBtn.current?.focus({ preventScroll: true });
		} else if (tl.current) {
			tl.current.timeScale(1.5).reverse();
		}
	}, [open, mounted]);

	// A new page is in: the menu draws back (the same animation as Close) and reveals it, rather than snapping shut.
	useEffect(() => {
		setOpen(false);
	}, [path]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	useEffect(() => () => void (document.body.style.overflow = ""), []);

	return (
		<>
			<button
				ref={opener}
				type="button"
				onClick={() => setOpen(true)}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls="admin-menu"
				className="flex h-11 cursor-pointer items-center gap-2.5 rounded-md bg-surface pl-3.5 pr-4 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-foreground outline-none transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-accent"
			>
				<Menu aria-hidden size={18} />
				Menu
			</button>

			{mounted &&
				createPortal(
					<div
						id="admin-menu"
						ref={sheet}
						data-surface="hero"
						role="dialog"
						aria-modal="true"
						aria-label="Admin menu"
						aria-hidden={!open}
						inert={!open}
						data-lenis-prevent
						className="fixed inset-0 z-1200 flex flex-col text-foreground"
						style={{ visibility: "hidden" }}
					>
						<canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />

						<div className="relative flex h-16 shrink-0 items-center justify-between px-6">
							<span data-menu-fade className="font-heading text-lg font-semibold tracking-[-0.03em]">SM Chemicals</span>
							{/* In the same place, the same size, as the Menu button it replaces. */}
							<button
								ref={closeBtn}
								type="button"
								onClick={() => setOpen(false)}
								data-menu-fade
								className="flex h-11 cursor-pointer items-center gap-2.5 rounded-md bg-foreground/10 pl-3.5 pr-4 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] outline-none transition-colors hover:bg-foreground/15 focus-visible:ring-2 focus-visible:ring-accent"
							>
								<X aria-hidden size={18} />
								Close
							</button>
						</div>

						<nav aria-label="Admin" className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
							<div className="space-y-5">
								{groups.map((g, gi) => (
									<div key={gi}>
										{g.title && (
											<p data-menu-fade className="mb-1 px-3 text-sm font-medium text-foreground/60">
												{g.title}
											</p>
										)}
										<ul className="space-y-1">
											{g.links.map(({ href, label }) => {
												const on = active(href);
												return (
													<li key={href} className="overflow-hidden rounded-md">
														<Link
															data-menu-line
															href={href}
															onClick={() => setOpen(false)}
															tabIndex={open ? 0 : -1}
															aria-current={on ? "page" : undefined}
															className={`flex h-[2.625rem] items-center rounded-md px-3 font-heading text-[1.0625rem] tracking-[-0.02em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
																on ? "bg-foreground font-semibold text-background" : "font-medium text-foreground/85 hover:bg-foreground/10 hover:text-foreground"
															}`}
														>
															{label}
														</Link>
													</li>
												);
											})}
										</ul>
									</div>
								))}
							</div>
						</nav>

						<div className="relative shrink-0 space-y-3 px-6 pb-5 pt-3">
							<div data-menu-fade className="flex items-center gap-6 text-base">
								<a href="/" target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1} className="inline-flex min-h-10 items-center gap-1 text-foreground/85 hover:text-foreground">
									View site
									<ArrowUpRight aria-hidden className="h-4 w-4" />
								</a>
								<ThemeToggle className="min-h-10 text-base text-foreground/85 hover:text-foreground" />
							</div>
							<div data-menu-fade>
								<p className="text-base font-medium leading-snug [overflow-wrap:anywhere]">{email}</p>
								<p className="text-sm capitalize text-foreground/60">{role}</p>
							</div>
							<form data-menu-fade action={signOut}>
								<SignOutButton variant="rail" />
							</form>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
