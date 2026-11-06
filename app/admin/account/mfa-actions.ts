"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, DEV_BYPASS } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";
import { allow } from "@/lib/security/rate-limit";

export type MfaSetup = { error?: string; factorId?: string; qr?: string; secret?: string };
export type MfaResult = { error?: string; ok?: boolean };

const NOT_CONNECTED = "Two-step sign-in needs Supabase. Connect it to set this up.";

/* Begins setup: a fresh authenticator secret, as a QR code and as text. Half-finished attempts are cleared first. */
export async function startMfaSetup(): Promise<MfaSetup> {
	await requireStaff({ allowSetup: true });
	if (DEV_BYPASS || !supabaseConfigured()) return { error: NOT_CONNECTED };

	const supabase = await createClient();
	const { data: list } = await supabase.auth.mfa.listFactors();
	for (const f of list?.all ?? []) {
		if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
	}
	const { data, error } = await supabase.auth.mfa.enroll({
		factorType: "totp",
		issuer: "SM Chemicals",
		friendlyName: `Authenticator ${Date.now()}`,
	});
	if (error || !data) return { error: "Couldn't start setup. Check that two-step sign-in is switched on in Supabase (Authentication, Multi-Factor)." };
	return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

/* Finishes setup with the first code. From here on this sign-in is a two-step one. */
export async function confirmMfaSetup(factorId: string, rawCode: string): Promise<MfaResult> {
	const profile = await requireStaff({ allowSetup: true });
	const code = String(rawCode ?? "").replace(/\s+/g, "");
	if (!/^\d{6}$/.test(code)) return { error: "Enter the 6 digits shown in your authenticator app." };
	if (!allow(`mfa-setup:${profile.id}`, 8, 10 * 60_000)) return { error: "Too many attempts. Wait a few minutes and try again." };

	const supabase = await createClient();
	const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
	if (error) return { error: "That code didn't match. Codes change every 30 seconds, so try the current one." };
	await logActivity("edit", "Account", "Turned on two-step sign-in");
	revalidatePath("/admin", "layout");
	return { ok: true };
}

/* Turns it off for yourself. Supabase only allows this from a session that has already passed the second step. */
export async function removeMfa(factorId: string): Promise<MfaResult> {
	await requireStaff({ allowSetup: true });
	if (DEV_BYPASS || !supabaseConfigured()) return { error: NOT_CONNECTED };
	const supabase = await createClient();
	const { error } = await supabase.auth.mfa.unenroll({ factorId });
	if (error) return { error: "Couldn't turn it off. Sign out, sign in again with your code, then try once more." };
	await logActivity("edit", "Account", "Turned off two-step sign-in");
	revalidatePath("/admin", "layout");
	return { ok: true };
}
