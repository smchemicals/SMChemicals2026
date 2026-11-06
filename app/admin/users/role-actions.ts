"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";
import { ALL_SECTIONS } from "@/lib/permissions";

export type RoleState = { ok?: string; error?: string };
export type RowResult = { ok?: boolean; error?: string };

const DEV_NOTICE = "Dev mode, connect Supabase to manage roles.";
const RESERVED = ["founder", "admin", "editor"];

function slugify(s: string): string {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function createRole(
	_prev: RoleState,
	formData: FormData,
): Promise<RoleState> {
	await requirePermission("users");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const label = String(formData.get("label") ?? "").trim();
	if (!label) return { error: "Role name is required." };
	const key = slugify(String(formData.get("key") ?? "") || label);
	if (!key) return { error: "Invalid role key." };
	if (RESERVED.includes(key)) return { error: "That role key is reserved." };

	const admin = createAdminClient();
	const { error } = await admin
		.from("roles")
		.insert({ key, label, is_system: false });
	if (error)
		return {
			error:
				error.code === "23505"
					? `A role “${key}” already exists.`
					: error.message,
		};

	revalidatePath("/admin/users");
	await logActivity("update_role", label, `Created role “${key}”`);
	return { ok: `Created role “${label}”.` };
}

export async function deleteRole(key: string): Promise<RowResult> {
	await requirePermission("users");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const admin = createAdminClient();
	const { data: role } = await admin
		.from("roles")
		.select("is_system")
		.eq("key", key)
		.maybeSingle();
	if (!role) return { error: "Role not found." };
	if (role.is_system) return { error: "Built-in roles can't be deleted." };

	const { count } = await admin
		.from("profiles")
		.select("id", { count: "exact", head: true })
		.eq("role", key);
	if ((count ?? 0) > 0)
		return { error: "Reassign the users on this role before deleting it." };

	const { error } = await admin.from("roles").delete().eq("key", key);
	if (error) return { error: error.message };

	revalidatePath("/admin/users");
	await logActivity("update_role", key, "Deleted role");
	return { ok: true };
}

export async function setRolePermissions(
	role: string,
	sections: string[],
): Promise<RowResult> {
	await requirePermission("users");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (role === "founder")
		return { error: "Founder always has full access." };

	const admin = createAdminClient();
	const { data: exists } = await admin
		.from("roles")
		.select("key")
		.eq("key", role)
		.maybeSingle();
	if (!exists) return { error: "Role not found." };

	const valid = sections.filter((s) => (ALL_SECTIONS as string[]).includes(s));

	const del = await admin.from("role_permissions").delete().eq("role", role);
	if (del.error) return { error: del.error.message };
	if (valid.length) {
		const ins = await admin
			.from("role_permissions")
			.insert(valid.map((section) => ({ role, section })));
		if (ins.error) return { error: ins.error.message };
	}

	revalidatePath("/admin/users");
	revalidatePath("/admin", "layout");
	await logActivity(
		"update_role",
		role,
		`Permissions: ${valid.join(", ") || "none"}`,
	);
	return { ok: true };
}
