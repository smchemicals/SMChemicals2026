/*
 * One fetch for every Supabase client. If the database is unreachable (a paused or removed project, bad DNS, offline), a
 * plain fetch fails slowly and the client then retries with growing waits, which can stall a page for many seconds,
 * and the admin, which asks several questions at once, for nearly a minute. This one gives up after a few seconds, then
 * skips Supabase for a short while so pages fall back at once. A network failure is answered with an ordinary
 * "502 unreachable" response (never thrown, and not a status the client retries), so callers see a normal error and
 * their fallbacks (defaults on the public site, an error message in the admin) take over. HTTP errors pass through.
 */
const TIMEOUT_MS = 3000;
const COOLDOWN_MS = 30_000;
let downUntil = 0;

const unreachable = () =>
	new Response(JSON.stringify({ message: "Supabase is unreachable", code: "UNREACHABLE" }), {
		status: 502,
		headers: { "Content-Type": "application/json" },
	});

export const failFastFetch: typeof fetch = async (input, init) => {
	if (Date.now() < downUntil) return unreachable();
	const timeout = AbortSignal.timeout(TIMEOUT_MS);
	const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
	try {
		return await fetch(input, { ...init, signal });
	} catch {
		downUntil = Date.now() + COOLDOWN_MS;
		return unreachable();
	}
};
