"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/* Tells our own server a page was viewed (see lib/cms/analytics.ts). Sends the path and nothing else, stores nothing here. */
export function ViewTracker() {
	const pathname = usePathname();
	useEffect(() => {
		try {
			const body = JSON.stringify({ path: pathname });
			if (!navigator.sendBeacon?.("/api/view", new Blob([body], { type: "application/json" }))) {
				void fetch("/api/view", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
			}
		} catch {}
	}, [pathname]);
	return null;
}
