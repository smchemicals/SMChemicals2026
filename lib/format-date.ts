/*
 * Dates in the admin are written the same way on the server and in the browser: a fixed locale and time zone, so the
 * text the server renders is exactly what the browser expects (a locale-dependent format breaks hydration).
 */
const ZONE = "Asia/Kolkata";

export const formatDate = (iso: string | null | undefined, fallback = "Not set") =>
	iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: ZONE }) : fallback;

export const formatDateTime = (iso: string | null | undefined, fallback = "") =>
	iso
		? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: ZONE })
		: fallback;
