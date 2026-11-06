"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

/*
 * The captcha for the public forms, when the site has one configured (NEXT_PUBLIC_TURNSTILE_SITE_KEY). Without a key it
 * renders nothing and the forms work as they do without one. `onToken` gets the token, or "" when it expires or fails.
 */
export const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type Api = { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
const api = () => (window as unknown as { turnstile?: Api }).turnstile;

export function TurnstileBox({ onToken, className }: { onToken: (token: string) => void; className?: string }) {
	const box = useRef<HTMLDivElement>(null);
	const id = useRef<string | null>(null);

	useEffect(() => {
		if (!TURNSTILE_KEY) return;
		let timer: ReturnType<typeof setInterval> | undefined;
		const draw = () => {
			const t = api();
			if (!box.current || !t || id.current) return;
			id.current = t.render(box.current, {
				sitekey: TURNSTILE_KEY,
				theme: "auto",
				callback: (t: string) => onToken(t),
				"error-callback": () => onToken(""),
				"expired-callback": () => onToken(""),
			});
		};
		if (api()) draw();
		else {
			timer = setInterval(() => {
				if (api()) {
					clearInterval(timer);
					draw();
				}
			}, 150);
		}
		return () => {
			if (timer) clearInterval(timer);
			if (id.current) api()?.remove(id.current);
			id.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (!TURNSTILE_KEY) return null;
	return (
		<>
			<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
			<div ref={box} className={className} />
		</>
	);
}
