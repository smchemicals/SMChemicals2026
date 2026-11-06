"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { login } from "./actions";
import AuthOverlay from "@/components/admin/AuthOverlay";
import { BTN, Field, Notice } from "@/components/admin/ui";
import { AuthScreen, AUTH_FIELD, AUTH_LABEL } from "@/components/admin/AuthScreen";


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
				theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",
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

	return (
		<AuthScreen title="Sign in">
			<AuthOverlay show={pending} label="Signing you in" />
			{SITE_KEY && (
				<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
			)}
			<form action={formAction} className="flex flex-col gap-6">
				<input type="hidden" name="next" value={next} />
				{SITE_KEY && <input type="hidden" name="cf-turnstile-response" value={token} />}
				<div data-in>
					<Field label="Email" className={AUTH_LABEL}>
						<input type="email" name="email" required autoFocus autoComplete="username" placeholder="you@smchemicals.co.in" className={AUTH_FIELD} />
					</Field>
				</div>
				<div data-in>
					<Field label="Password" className={AUTH_LABEL}>
						<input type="password" name="password" required autoComplete="current-password" className={AUTH_FIELD} />
					</Field>
				</div>

				{SITE_KEY && <div ref={boxRef} data-in className="min-h-16.25" />}

				<div data-in>
					<button type="submit" disabled={pending} className={`${BTN} !h-14 w-full !text-lg sm:w-auto sm:!px-10`}>
						{pending ? "Signing in…" : "Sign in"}
					</button>
				</div>
				{state.error && <Notice tone="danger">{state.error}</Notice>}
			</form>
		</AuthScreen>
	);
}
