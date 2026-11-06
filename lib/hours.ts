/*
 * Opening hours, kept as the one string the CMS already stores ("Mon - Sat: 09:00 - 18:00") and read here.
 * The business is in Hyderabad, so "now" is always India time, wherever the visitor is.
 */
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type Hours = { from: number; to: number; open: number; close: number };
export type OpenStatus = { open: boolean; label: string };

export function parseHours(text: string): Hours | null {
	const m = /([a-z]{3})[a-z]*\s*[-–]\s*([a-z]{3})[a-z]*\W+(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/i.exec(text);
	if (!m) return null;
	const from = DAYS.indexOf(m[1].toLowerCase());
	const to = DAYS.indexOf(m[2].toLowerCase());
	if (from < 0 || to < 0) return null;
	return { from, to, open: Number(m[3]) * 60 + Number(m[4]), close: Number(m[5]) * 60 + Number(m[6]) };
}

const clock = (mins: number) => {
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	return `${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
};

const inDays = (h: Hours, day: number) => (h.from <= h.to ? day >= h.from && day <= h.to : day >= h.from || day <= h.to);

export function openStatus(h: Hours, now = new Date()): OpenStatus {
	const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
	const day = DAYS.indexOf(get("weekday").toLowerCase());
	const mins = Number(get("hour")) * 60 + Number(get("minute"));
	if (inDays(h, day) && mins >= h.open && mins < h.close) return { open: true, label: `Open now, until ${clock(h.close)}` };
	// Closed: find the next opening, today if it's still ahead, otherwise the next working day.
	if (inDays(h, day) && mins < h.open) return { open: false, label: `Closed, opens today at ${clock(h.open)}` };
	for (let i = 1; i <= 7; i++) {
		const d = (day + i) % 7;
		if (inDays(h, d)) return { open: false, label: `Closed, opens ${i === 1 ? "tomorrow" : NAMES[d]} at ${clock(h.open)}` };
	}
	return { open: false, label: "Closed" };
}
