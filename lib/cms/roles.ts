import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/cms/products";
import { ALL_SECTIONS, type Section } from "@/lib/permissions";

export interface RoleRow {
	key: string;
	label: string;
	is_system: boolean;
}

// Built-in fallback (dev / no Supabase) mirroring the roles seeded in 0001_core.sql.
const DEV_ROLES: RoleRow[] = [
	{ key: "founder", label: "Founder", is_system: true },
	{ key: "admin", label: "Admin", is_system: true },
	{ key: "editor", label: "Editor", is_system: true },
];
const DEV_PERMS: Record<string, Section[]> = {
	founder: [...ALL_SECTIONS],
	admin: [...ALL_SECTIONS],
	editor: ["products", "content", "about", "careers", "blog"],
};

export async function getRoles(): Promise<RoleRow[]> {
	if (!supabaseConfigured()) return DEV_ROLES;
	try {
		const admin = createAdminClient();
		const { data } = await admin
			.from("roles")
			.select("key, label, is_system")
			.order("is_system", { ascending: false })
			.order("label", { ascending: true });
		return (data ?? []) as RoleRow[];
	} catch {
		return DEV_ROLES;
	}
}

export async function getPermissionsByRole(): Promise<
	Record<string, Section[]>
> {
	if (!supabaseConfigured()) return DEV_PERMS;
	try {
		const admin = createAdminClient();
		const { data } = await admin
			.from("role_permissions")
			.select("role, section");
		const map: Record<string, Section[]> = {};
		for (const r of (data ?? []) as { role: string; section: string }[]) {
			(map[r.role] ??= []).push(r.section as Section);
		}
		// Founder implicitly has everything.
		map.founder = [...ALL_SECTIONS];
		return map;
	} catch {
		return DEV_PERMS;
	}
}
