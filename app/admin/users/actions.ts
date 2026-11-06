"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, DEV_BYPASS, type Role } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";

export type TeamResult = { ok?: boolean; error?: string };
export type CreateUserState = { error?: string; ok?: string };

const DEV_NOTICE = "Dev mode, connect Supabase to manage real users.";

const CreateUserSchema = z.object({
	email: z.string().email(),
	role: z.string().trim().min(1),
	password: z.string().min(8, "Password must be at least 8 characters."),
	full_name: z.string().optional(),
});

async function roleExists(
	admin: ReturnType<typeof createAdminClient>,
	role: string,
): Promise<boolean> {
	const { data } = await admin
		.from("roles")
		.select("key")
		.eq("key", role)
		.maybeSingle();
	return Boolean(data);
}

export async function createUser(
	_prev: CreateUserState,
	formData: FormData,
): Promise<CreateUserState> {
	await requirePermission("users");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const parsed = CreateUserSchema.safeParse({
		email: formData.get("email"),
		role: formData.get("role"),
		password: formData.get("password"),
		full_name: formData.get("full_name") ?? undefined,
	});
	if (!parsed.success) {
		return {
			error:
				parsed.error.issues[0]?.message ??
				"Enter a valid email, role, and password.",
		};
	}

	const admin = createAdminClient();
	if (!(await roleExists(admin, parsed.data.role)))
		return { error: "Unknown role." };
	const { data, error } = await admin.auth.admin.createUser({
		email: parsed.data.email,
		password: parsed.data.password,
		email_confirm: true,
	});
	if (error) return { error: error.message };

	if (data.user) {
		await admin.from("profiles").upsert(
			{
				id: data.user.id,
				email: parsed.data.email,
				role: parsed.data.role,
				full_name: parsed.data.full_name?.trim() || null,
			},
			{ onConflict: "id" },
		);
	}

	revalidatePath("/admin/users");
	await logActivity("create_user", parsed.data.email, `Role: ${parsed.data.role}`);
	return {
		ok: `Created ${parsed.data.email} as ${parsed.data.role}. They sign in with the password you set.`,
	};
}

async function loadTarget(id: string) {
	const admin = createAdminClient();
	const { data } = await admin
		.from("profiles")
		.select("id, email, role")
		.eq("id", id)
		.single();
	return data as { id: string; email: string; role: Role } | null;
}

async function founderCount(): Promise<number> {
	const admin = createAdminClient();
	const { count } = await admin
		.from("profiles")
		.select("id", { count: "exact", head: true })
		.eq("role", "founder");
	return count ?? 0;
}

export async function updateUserRole(
	id: string,
	role: string,
): Promise<TeamResult> {
	const actor = await requirePermission("users");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	const adminCheck = createAdminClient();
	if (!(await roleExists(adminCheck, role)))
		return { error: "Invalid role." };
	const next = role;
	if (id === actor.id) return { error: "You can't change your own role." };

	const target = await loadTarget(id);
	if (!target) return { error: "User not found." };
	if (target.role === next) return { ok: true };

	if (next === "founder" && actor.role !== "founder")
		return { error: "Only a founder can grant the founder role." };
	if (target.role === "founder" && actor.role !== "founder")
		return { error: "Only a founder can change another founder." };
	if (
		target.role === "founder" &&
		next !== "founder" &&
		(await founderCount()) <= 1
	)
		return { error: "At least one founder is required." };

	const admin = createAdminClient();
	const { error } = await admin
		.from("profiles")
		.update({ role: next })
		.eq("id", id);
	if (error) return { error: error.message };
	revalidatePath("/admin/users");
	await logActivity("update_role", target.email, `${target.role} → ${next}`);
	return { ok: true };
}

export async function deleteUser(id: string): Promise<TeamResult> {
	const actor = await requirePermission("users");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (id === actor.id) return { error: "You can't remove your own account." };

	const target = await loadTarget(id);
	if (!target) return { error: "User not found." };
	if (target.role === "founder" && actor.role !== "founder")
		return { error: "Only a founder can remove another founder." };
	if (target.role === "founder" && (await founderCount()) <= 1)
		return { error: "At least one founder is required." };

	const admin = createAdminClient();
	const { error } = await admin.auth.admin.deleteUser(id);
	if (error) return { error: error.message };
	revalidatePath("/admin/users");
	await logActivity("delete_user", target.email);
	return { ok: true };
}

export async function resetUserPassword(
	id: string,
	password: string,
): Promise<TeamResult> {
	const actor = await requirePermission("users");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (!password || password.length < 8)
		return { error: "Password must be at least 8 characters." };

	const target = await loadTarget(id);
	if (!target) return { error: "User not found." };
	if (target.role === "founder" && actor.role !== "founder" && id !== actor.id)
		return { error: "Only a founder can reset another founder's password." };

	const admin = createAdminClient();
	const { error } = await admin.auth.admin.updateUserById(id, { password });
	if (error) return { error: error.message };
	await logActivity("reset_password", target.email);
	return { ok: true };
}
