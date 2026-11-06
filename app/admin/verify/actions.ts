"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { allow } from "@/lib/security/rate-limit";

export interface VerifyState {
	error?: string;
}

/* The six digits from the authenticator app. Spaces are allowed, so a code copied as "123 456" works. */
const cleanCode = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\s+/g, "");

export async function verifyCode(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
	const user = await getSessionUser();
	if (!user) redirect("/admin/login");

	const code = cleanCode(formData.get("code"));
	if (!/^\d{6}$/.test(code)) return { error: "Enter the 6 digits shown in your authenticator app." };
	// Eight tries in ten minutes per person; Supabase limits attempts on its side too.
	if (!allow(`mfa:${user.id}`, 8, 10 * 60_000)) return { error: "Too many attempts. Wait a few minutes and try again." };

	const supabase = await createClient();
	const { data } = await supabase.auth.mfa.listFactors();
	const factor = data?.totp?.[0];
	if (!factor) redirect("/admin");

	const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
	if (error) return { error: "That code didn't match. Codes change every 30 seconds, so try the current one." };
	redirect("/admin");
}
