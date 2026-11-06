import { NextResponse } from "next/server";
import { cleanPath, recordView } from "@/lib/cms/analytics";
import { allow, clientIp, sameOrigin } from "@/lib/security/rate-limit";

/* Counts one page view. Answers 204 whatever happens: counting is never the visitor's problem. */
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|facebookexternalhit/i;

export async function POST(req: Request) {
	// Local development isn't traffic, and a browser asking not to be tracked is respected.
	if (process.env.NODE_ENV !== "production" || req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") {
		return new NextResponse(null, { status: 204 });
	}
	if (BOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
	// Only from our own pages, and a sane number per visitor, so the count can't be inflated by a script.
	if (!sameOrigin(req) || !allow(`view:${clientIp(req)}`, 60, 60_000)) return new NextResponse(null, { status: 204 });
	try {
		const body = (await req.json()) as { path?: unknown };
		const path = cleanPath(body.path);
		if (path) await recordView(path);
	} catch {}
	return new NextResponse(null, { status: 204 });
}
