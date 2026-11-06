/*
 * Small abuse guards for the public API routes. The limiter keeps its counts in memory, so on a host that runs several
 * instances each keeps its own count: it stops a script hammering one endpoint, which is the aim, and it is not a
 * precise global quota. For hard limits put the host's own rate limiting (or a WAF) in front.
 */
const buckets = new Map<string, number[]>();

/* Allow `max` hits per `windowMs` for a key; the hit is counted. */
export function allow(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
	if (hits.length >= max) {
		buckets.set(key, hits);
		return false;
	}
	hits.push(now);
	buckets.set(key, hits);
	// Keep the map from growing without end.
	if (buckets.size > 5000) {
		for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
	}
	return true;
}

export function clientIp(req: Request): string {
	const fwd = req.headers.get("x-forwarded-for");
	if (fwd) return fwd.split(",")[0]!.trim();
	return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/* A browser form post from another site carries a different Origin; refuse it. Requests without one (scripts) pass here and meet the other guards. */
export function sameOrigin(req: Request): boolean {
	const origin = req.headers.get("origin");
	if (!origin) return true;
	try {
		const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}
