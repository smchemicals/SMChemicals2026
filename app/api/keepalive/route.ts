import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

/*
 * Keeps the Supabase project from being paused for inactivity. Vercel Cron calls this once a day (see vercel.json) and
 * sends CRON_SECRET as a bearer token; anyone else gets a 401. It runs one tiny read, which is what counts as activity.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	const secret = process.env.CRON_SECRET;
	if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
		return new NextResponse("Unauthorized", { status: 401 });
	}
	try {
		const { error } = await createPublicClient().from("products").select("id").limit(1);
		if (error) return NextResponse.json({ ok: false }, { status: 502 });
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ ok: false }, { status: 502 });
	}
}
