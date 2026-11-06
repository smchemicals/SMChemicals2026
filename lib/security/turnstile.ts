export const TURNSTILE_SITE_KEY =
	process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export const turnstileEnabled = Boolean(
	process.env.TURNSTILE_SECRET_KEY && TURNSTILE_SITE_KEY,
);

export interface TurnstileResult {
	ok: boolean;
	reason?: string;
}

export async function verifyTurnstile(
	token: string | null,
	ip: string,
): Promise<TurnstileResult> {
	const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
	if (!secret) return { ok: true };
	if (!token) {
		console.error(
			"[turnstile] no token submitted, widget likely did not render. " +
				"Check NEXT_PUBLIC_TURNSTILE_SITE_KEY is in the deployed build.",
		);
		return { ok: false, reason: "no-token" };
	}

	try {
		const body = new URLSearchParams({ secret, response: token });
		if (ip && ip !== "unknown") body.set("remoteip", ip);

		const res = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body,
				cache: "no-store",
			},
		);
		const data = (await res.json()) as {
			success?: boolean;
			"error-codes"?: string[];
		};
		if (data.success === true) return { ok: true };
		const codes = (data["error-codes"] ?? ["unknown"]).join(",");
		console.error("[turnstile] siteverify rejected:", codes);
		return { ok: false, reason: codes };
	} catch (e) {
		console.error("[turnstile] siteverify request failed:", e);
		return { ok: false, reason: "request-failed" };
	}
}
