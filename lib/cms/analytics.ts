import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/cms/products";

/*
 * First-party page-view counts: one number per page per day, kept in our own database (the page_views table). No cookies, no
 * visitor identifiers, nothing about who looked. The site adds a view through /api/view; the admin Analytics page reads
 * them. If the table isn't there yet, recording does nothing and the admin says how to switch it on.
 */
const SKIP = ["/admin", "/api", "/preview", "/_next"];

/* A clean path to count, or null for pages that should not be counted. */
export function cleanPath(raw: unknown): string | null {
	if (typeof raw !== "string") return null;
	const p = raw.split(/[?#]/)[0].trim();
	if (!p.startsWith("/") || p.length > 200) return null;
	if (SKIP.some((s) => p === s || p.startsWith(`${s}/`))) return null;
	return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

export async function recordView(path: string): Promise<void> {
	if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
	try {
		await createAdminClient().rpc("track_view", { p_path: path });
	} catch {
		// Counting must never break a page.
	}
}

export type ViewStats =
	| { available: false; reason: "not-configured" | "missing-table" }
	| {
			available: true;
			days: number;
			total: number;
			today: number;
			average: number;
			perDay: { day: string; views: number }[];
			pages: { path: string; views: number }[];
	  };

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function getViewStats(days: number): Promise<ViewStats> {
	if (!supabaseConfigured()) return { available: false, reason: "not-configured" };
	try {
		const supabase = await createClient();
		const from = new Date();
		from.setUTCDate(from.getUTCDate() - (days - 1));
		const { data, error } = await supabase.from("page_views").select("day, path, views").gte("day", iso(from)).limit(50000);
		if (error) return { available: false, reason: "missing-table" };

		const byDay = new Map<string, number>();
		const byPage = new Map<string, number>();
		for (const r of data ?? []) {
			const v = Number(r.views) || 0;
			byDay.set(r.day as string, (byDay.get(r.day as string) ?? 0) + v);
			byPage.set(r.path as string, (byPage.get(r.path as string) ?? 0) + v);
		}
		const perDay: { day: string; views: number }[] = [];
		for (let i = 0; i < days; i++) {
			const d = new Date(from);
			d.setUTCDate(from.getUTCDate() + i);
			perDay.push({ day: iso(d), views: byDay.get(iso(d)) ?? 0 });
		}
		const total = perDay.reduce((n, d) => n + d.views, 0);
		return {
			available: true,
			days,
			total,
			today: perDay[perDay.length - 1]?.views ?? 0,
			average: Math.round(total / days),
			perDay,
			pages: [...byPage.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 12),
		};
	} catch {
		return { available: false, reason: "missing-table" };
	}
}
