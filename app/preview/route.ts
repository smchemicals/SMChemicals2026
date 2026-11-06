import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";

// Staff-only: turn on Draft Mode, then open the requested public page so its
// unpublished draft content is shown.
export async function GET(request: Request) {
	const profile = await getProfile();
	if (!profile || profile.mfa !== "ok")
		return NextResponse.redirect(new URL("/admin/login", request.url));

	const { searchParams } = new URL(request.url);
	const raw = searchParams.get("path") || "/";
	const path = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

	(await draftMode()).enable();
	return NextResponse.redirect(new URL(path, request.url));
}
