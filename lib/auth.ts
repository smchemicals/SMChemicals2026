import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ALL_SECTIONS, type Section } from "@/lib/permissions";

// Kept for the few places that still reference the built-in tiers by name.
export type Role = string;

/*
 * Where this sign-in stands on the second step (an authenticator app):
 *   ok      the session has passed it, or the account doesn't need it
 *   verify  the account has an authenticator and this sign-in hasn't entered its code yet
 *   enroll  the account must have one (founder and admin) but hasn't set it up yet
 */
export type MfaState = "ok" | "verify" | "enroll";

export interface Profile {
	id: string;
	email: string;
	role: string;
	full_name: string | null;
	permissions: Section[];
	mfa: MfaState;
}

/* Roles that must use two-step sign-in. Set ADMIN_MFA=off to switch the requirement off (a code is still asked for by anyone who has set one up). */
const MFA_REQUIRED_ROLES = new Set(["founder", "admin"]);
const MFA_REQUIRED = process.env.ADMIN_MFA !== "off";

// DEV BYPASS: when ADMIN_DEV=true the admin is open without Supabase auth. Local development only.
// It cannot be switched on in a production build, so a stray ADMIN_DEV in a deployment's settings opens nothing.
export const DEV_BYPASS = process.env.ADMIN_DEV === "true" && process.env.NODE_ENV !== "production";

const DEV_PROFILE: Profile = {
	id: "dev",
	email: "dev@local",
	role: "founder",
	full_name: "Developer",
	permissions: [...ALL_SECTIONS],
	mfa: "ok",
};

export async function getSessionUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
}

export async function getProfile(): Promise<Profile | null> {
	if (DEV_BYPASS) return DEV_PROFILE;
	const user = await getSessionUser();
	if (!user) return null;
	const supabase = await createClient();
	const { data } = await supabase
		.from("profiles")
		.select("id, email, role, full_name")
		.eq("id", user.id)
		.single();
	if (!data) return null;

	const base = data as Omit<Profile, "permissions" | "mfa">;
	let permissions: Section[];
	if (base.role === "founder") {
		permissions = [...ALL_SECTIONS];
	} else {
		const { data: perms } = await supabase
			.from("role_permissions")
			.select("section")
			.eq("role", base.role);
		permissions = ((perms ?? []) as { section: string }[]).map(
			(p) => p.section as Section,
		);
	}

	// The second step. "currentLevel" is what this session has proved (aal2 after a code), "nextLevel" is what the account
	// is able to reach (aal2 once an authenticator is set up).
	let mfa: MfaState = "ok";
	try {
		const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
		if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") mfa = "verify";
		else if (aal?.nextLevel !== "aal2" && MFA_REQUIRED && MFA_REQUIRED_ROLES.has(base.role)) mfa = "enroll";
	} catch {
		// If the level can't be read, fail closed for the roles that need it.
		mfa = MFA_REQUIRED && MFA_REQUIRED_ROLES.has(base.role) ? "verify" : "ok";
	}
	return { ...base, permissions, mfa };
}

export function hasPermission(
	profile: Profile | null,
	section: Section,
): boolean {
	if (!profile) return false;
	return profile.role === "founder" || profile.permissions.includes(section);
}

/* Sends a signed-in person to the second step if they still owe one. The Account page lets someone who must set it up in. */
function secondStep(profile: Profile, allowSetup = false) {
	if (profile.mfa === "verify") redirect("/admin/verify");
	if (profile.mfa === "enroll" && !allowSetup) redirect("/admin/account");
}

// Any signed-in team member (Overview, Account).
export async function requireStaff(opts: { allowSetup?: boolean } = {}): Promise<Profile> {
	if (DEV_BYPASS) return DEV_PROFILE;
	const profile = await getProfile();
	if (!profile) redirect("/admin/login");
	secondStep(profile, opts.allowSetup);
	return profile;
}

// A specific section capability.
export async function requirePermission(section: Section): Promise<Profile> {
	if (DEV_BYPASS) return DEV_PROFILE;
	const profile = await getProfile();
	if (!profile) redirect("/admin/login");
	secondStep(profile);
	if (!hasPermission(profile, section)) redirect("/admin");
	return profile;
}
