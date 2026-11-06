import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ALL_SECTIONS, type Section } from "@/lib/permissions";

// Kept for the few places that still reference the built-in tiers by name.
export type Role = string;

export interface Profile {
	id: string;
	email: string;
	role: string;
	full_name: string | null;
	permissions: Section[];
}

// DEV BYPASS: when ADMIN_DEV=true the admin is open without Supabase auth. Local development only.
// It cannot be switched on in a production build, so a stray ADMIN_DEV in a deployment's settings opens nothing.
export const DEV_BYPASS = process.env.ADMIN_DEV === "true" && process.env.NODE_ENV !== "production";

const DEV_PROFILE: Profile = {
	id: "dev",
	email: "dev@local",
	role: "founder",
	full_name: "Developer",
	permissions: [...ALL_SECTIONS],
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

	const base = data as Omit<Profile, "permissions">;
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
	return { ...base, permissions };
}

export function hasPermission(
	profile: Profile | null,
	section: Section,
): boolean {
	if (!profile) return false;
	return profile.role === "founder" || profile.permissions.includes(section);
}

// Any signed-in team member (Overview, Account).
export async function requireStaff(): Promise<Profile> {
	if (DEV_BYPASS) return DEV_PROFILE;
	const profile = await getProfile();
	if (!profile) redirect("/admin/login");
	return profile;
}

// A specific section capability.
export async function requirePermission(section: Section): Promise<Profile> {
	if (DEV_BYPASS) return DEV_PROFILE;
	const profile = await getProfile();
	if (!profile) redirect("/admin/login");
	if (!hasPermission(profile, section)) redirect("/admin");
	return profile;
}
