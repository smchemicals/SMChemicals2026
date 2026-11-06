"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

/*
 * Vercel Web Analytics, for the public site only. It is the cookieless counter the privacy page describes, so it keeps the
 * same promises as the site's own counter: a browser that asks not to be tracked (Do Not Track or Global Privacy Control)
 * is not counted, and the team's own pages (the admin and the draft preview) are never counted. The address is stored
 * without any #fragment. It runs only on the live site: in development the component sends nothing.
 */
const SKIP = ["/admin", "/preview", "/api"];

const beforeSend: BeforeSend = (event) => {
	const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { globalPrivacyControl?: boolean }) : null;
	if (nav && (nav.doNotTrack === "1" || nav.globalPrivacyControl === true)) return null;
	try {
		const url = new URL(event.url);
		if (SKIP.some((s) => url.pathname === s || url.pathname.startsWith(`${s}/`))) return null;
		url.hash = "";
		return { ...event, url: url.toString() };
	} catch {
		return event;
	}
};

export function SiteAnalytics() {
	return <Analytics beforeSend={beforeSend} />;
}
