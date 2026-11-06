import { defaultContact, defaultHome, type ContactContent, type HomeContent } from "@/data/content";

/*
 * What is stored for the Home and Contact sections is cleaned on the way out, so old or hand-edited rows can never put
 * the site or the admin out of step with the design: fields that no longer exist are dropped, lists are trimmed and
 * emptied of blank lines, and a Maps link that is not a real https link is ignored. Missing fields take their defaults.
 */
const text = (v: unknown, fallback = "") => (typeof v === "string" ? v.trim() : fallback);
const lines = (v: unknown, fallback: string[]) => {
	const list = Array.isArray(v) ? v.map((x) => text(x)).filter(Boolean) : [];
	return list.length ? list : fallback;
};

export function cleanContact(raw: Partial<ContactContent> | null | undefined): ContactContent {
	const v = raw ?? {};
	const maps = text(v.mapsUrl);
	return {
		addressLines: lines(v.addressLines, defaultContact.addressLines),
		phone: text(v.phone, defaultContact.phone) || defaultContact.phone,
		email: text(v.email, defaultContact.email) || defaultContact.email,
		hours: text(v.hours, defaultContact.hours) || defaultContact.hours,
		mapsUrl: /^https:\/\//i.test(maps) ? maps : "",
	};
}

export function cleanHome(raw: Partial<HomeContent> | null | undefined): HomeContent {
	const v = raw ?? {};
	const stats = Array.isArray(v.stats)
		? v.stats
				.filter((s) => s && text(s.label))
				.map((s) => ({
					label: text(s.label),
					value: Number.isFinite(Number(s.value)) ? Number(s.value) : 0,
					suffix: text(s.suffix),
					...(Number(s.decimals) > 0 ? { decimals: Number(s.decimals) } : {}),
				}))
		: [];
	return {
		heroText: text(v.heroText) || defaultHome.heroText,
		sectors: lines(v.sectors, defaultHome.sectors).map((w) => w.replace(/\.$/, "")),
		stats: stats.length ? stats : defaultHome.stats,
	};
}
