"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { login } from "./actions";
import AuthOverlay from "@/components/admin/AuthOverlay";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

interface TurnstileApi {
	render: (el: HTMLElement, opts: Record<string, unknown>) => string;
	reset: (id?: string) => void;
	remove: (id: string) => void;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

export default function AdminLoginPage() {
	const [state, formAction, pending] = useActionState(login, {});
	const [next, setNext] = useState("/admin");
	const [token, setToken] = useState("");

	const boxRef = useRef<HTMLDivElement>(null);
	const widgetId = useRef<string | null>(null);

	useEffect(() => {
		const n = new URLSearchParams(window.location.search).get("next");
		if (n && n.startsWith("/admin") && !n.startsWith("//")) setNext(n);
	}, []);

	useEffect(() => {
		if (!SITE_KEY) return;
		let cancelled = false;
		let timer: ReturnType<typeof setInterval> | undefined;

		const render = () => {
			if (cancelled || !boxRef.current || !window.turnstile) return;
			if (widgetId.current) return;
			widgetId.current = window.turnstile.render(boxRef.current, {
				sitekey: SITE_KEY,
				theme: "dark",
				callback: (t: string) => setToken(t),
				"error-callback": () => setToken(""),
				"expired-callback": () => setToken(""),
				"response-field": false,
			});
		};

		if (window.turnstile) {
			render();
		} else {
			timer = setInterval(() => {
				if (window.turnstile) {
					clearInterval(timer);
					render();
				}
			}, 150);
		}

		return () => {
			cancelled = true;
			if (timer) clearInterval(timer);
			if (widgetId.current && window.turnstile) {
				try {
					window.turnstile.remove(widgetId.current);
				} catch {}
				widgetId.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (state.error && widgetId.current && window.turnstile) {
			try {
				window.turnstile.reset(widgetId.current);
			} catch {}
			setToken("");
		}
	}, [state]);

	const inputCls =
		"w-full border-b border-white/15 bg-transparent py-3 text-white text-xl font-light outline-none transition-colors placeholder:text-white/40 focus:border-accent-500";

	return (
		<div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-deep px-6 selection:bg-accent-500 selection:text-black">
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.06]"
				style={{
					backgroundImage:
						"radial-gradient(circle at center, var(--color-accent) 1px, transparent 1px)",
					backgroundSize: "34px 34px",
				}}
			/>
			<AuthOverlay show={pending} label="Signing you in" />
			{SITE_KEY && (
				<Script
					src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
					strategy="afterInteractive"
				/>
			)}
			<div className="relative z-10 w-full max-w-sm">
				<div className="mb-4 flex items-center gap-3">
					<span className="h-px w-6 bg-accent-500" />
					<span className="type-label text-accent-500">
						SM Chemicals
					</span>
				</div>
				<h1 className="mb-10 text-white text-4xl md:text-5xl font-bold tracking-tighter leading-[0.9]">
					Chemicals <span className="text-white/45 font-light">CMS.</span>
				</h1>

				<form action={formAction} className="flex flex-col gap-6">
					<input type="hidden" name="next" value={next} />
					{SITE_KEY && (
						<input type="hidden" name="cf-turnstile-response" value={token} />
					)}
					<label className="flex flex-col gap-2">
						<span className="type-label text-white/60">
							Email
						</span>
						<input
							type="email"
							name="email"
							required
							autoFocus
							autoComplete="username"
							placeholder="you@smchemicals.co.in"
							className={inputCls}
						/>
					</label>
					<label className="flex flex-col gap-2">
						<span className="type-label text-white/60">
							Password
						</span>
						<input
							type="password"
							name="password"
							required
							autoComplete="current-password"
							placeholder="••••••••"
							className={inputCls}
						/>
					</label>

					{SITE_KEY && <div ref={boxRef} className="min-h-[65px]" />}

					<button
						type="submit"
						disabled={pending}
						className="type-label group mt-2 inline-flex w-fit cursor-pointer items-center gap-3 bg-cta px-9 py-4 text-white transition-colors hover:bg-cta-hover disabled:opacity-50"
					>
						{pending ? "Signing in…" : "Sign in"}
						<span className="transition-transform duration-500 group-hover:translate-x-1">
							&rarr;
						</span>
					</button>
					{state.error && (
						<p className="text-sm text-accent-500">{state.error}</p>
					)}
				</form>
			</div>
		</div>
	);
}
