"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";

export type ActionState = { ok?: string; error?: string };
export type RowResult = { ok?: boolean; error?: string };

const DEV_NOTICE = "Dev mode — connect Supabase to save catalog changes.";

const SPEC_KEYS = [
	"chemicalName",
	"formula",
	"cas",
	"appearance",
	"purity",
	"grade",
	"solidContent",
	"packaging",
	"endUse",
	"synonyms",
] as const;

function slugify(s: string) {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function readSpec(formData: FormData) {
	const spec: Record<string, string> = {};
	for (const k of SPEC_KEYS) {
		const v = String(formData.get(k) ?? "").trim();
		if (v) spec[k] = v;
	}
	return spec;
}

function revalidate() {
	revalidatePath("/admin/products");
}

/* ---------------- Categories ---------------- */

const CategorySchema = z.object({
	name: z.string().trim().min(1, "Category name is required.").max(120),
	blurb: z.string().trim().max(400).optional(),
	popular: z.boolean(),
});

/* Friendlier message when migration 0009 (the `popular` column) hasn't run. */
const MISSING_POPULAR =
	"The “popular” column is missing — run supabase/migrations/0009_category_popular.sql.";
const popularError = (message: string) =>
	/popular/i.test(message) ? MISSING_POPULAR : message;

export async function createCategory(
	_prev: ActionState,
	formData: FormData,
): Promise<ActionState> {
	await requirePermission("products");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const parsed = CategorySchema.safeParse({
		name: formData.get("name"),
		blurb: formData.get("blurb") ?? undefined,
		popular: formData.get("popular") === "on",
	});
	if (!parsed.success)
		return { error: parsed.error.issues[0]?.message ?? "Invalid category." };

	const id = slugify(parsed.data.name);
	if (!id) return { error: "Category name must contain letters or numbers." };

	const admin = createAdminClient();
	const { count } = await admin
		.from("product_categories")
		.select("id", { count: "exact", head: true });
	const { error } = await admin.from("product_categories").insert({
		id,
		name: parsed.data.name,
		blurb: parsed.data.blurb ?? "",
		popular: parsed.data.popular,
		sort_order: count ?? 0,
	});
	if (error)
		return {
			error:
				error.code === "23505"
					? `A category “${id}” already exists.`
					: popularError(error.message),
		};

	revalidate();
	await logActivity("edit", "Products", `Added category “${parsed.data.name}”`);
	return { ok: `Added category “${parsed.data.name}”.` };
}

export async function updateCategory(
	_prev: ActionState,
	formData: FormData,
): Promise<ActionState> {
	await requirePermission("products");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const id = String(formData.get("id") ?? "");
	const parsed = CategorySchema.safeParse({
		name: formData.get("name"),
		blurb: formData.get("blurb") ?? undefined,
		popular: formData.get("popular") === "on",
	});
	if (!id) return { error: "Missing category id." };
	if (!parsed.success)
		return { error: parsed.error.issues[0]?.message ?? "Invalid category." };

	const admin = createAdminClient();
	const { error } = await admin
		.from("product_categories")
		.update({
			name: parsed.data.name,
			blurb: parsed.data.blurb ?? "",
			popular: parsed.data.popular,
		})
		.eq("id", id);
	if (error) return { error: popularError(error.message) };

	revalidate();
	await logActivity("edit", "Products", `Updated category “${parsed.data.name}”`);
	return { ok: "Category updated." };
}

/* One-click "Popular on homepage" toggle from the category row. */
export async function setCategoryPopular(
	id: string,
	popular: boolean,
): Promise<RowResult> {
	await requirePermission("products");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (!id) return { error: "Missing category id." };

	const admin = createAdminClient();
	const { error } = await admin
		.from("product_categories")
		.update({ popular })
		.eq("id", id);
	if (error) return { error: popularError(error.message) };

	revalidate();
	await logActivity(
		"edit",
		"Products",
		`${popular ? "Marked" : "Unmarked"} “${id}” as popular`,
	);
	return { ok: true };
}

export async function deleteCategory(id: string): Promise<RowResult> {
	await requirePermission("products");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (!id) return { error: "Missing category id." };

	const admin = createAdminClient();
	const { error } = await admin
		.from("product_categories")
		.delete()
		.eq("id", id);
	if (error) return { error: error.message };

	revalidate();
	await logActivity("edit", "Products", `Deleted category “${id}”`);
	return { ok: true };
}

/* ---------------- Products ---------------- */

const ProductSchema = z.object({
	category_id: z.string().trim().min(1),
	name: z.string().trim().min(1, "Product name is required.").max(200),
	description: z.string().trim().max(4000).optional(),
});

export async function saveProduct(
	_prev: ActionState,
	formData: FormData,
): Promise<ActionState> {
	await requirePermission("products");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const id = String(formData.get("id") ?? "").trim();
	const parsed = ProductSchema.safeParse({
		category_id: formData.get("category_id"),
		name: formData.get("name"),
		description: formData.get("description") ?? undefined,
	});
	if (!parsed.success)
		return { error: parsed.error.issues[0]?.message ?? "Invalid product." };

	const admin = createAdminClient();
	const payload = {
		category_id: parsed.data.category_id,
		name: parsed.data.name,
		description: parsed.data.description ?? "",
		spec: readSpec(formData),
		image_url: String(formData.get("image_url") ?? "").trim() || null,
	};

	if (id) {
		const { error } = await admin.from("products").update(payload).eq("id", id);
		if (error) return { error: error.message };
		revalidate();
		await logActivity("edit", "Products", `Updated “${parsed.data.name}”`);
		return { ok: "Product saved." };
	}

	const { count } = await admin
		.from("products")
		.select("id", { count: "exact", head: true })
		.eq("category_id", parsed.data.category_id);
	const { error } = await admin
		.from("products")
		.insert({ ...payload, sort_order: count ?? 0 });
	if (error) return { error: error.message };

	revalidate();
	await logActivity("edit", "Products", `Added “${parsed.data.name}”`);
	return { ok: `Added “${parsed.data.name}”.` };
}

export async function deleteProduct(id: string): Promise<RowResult> {
	await requirePermission("products");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (!id) return { error: "Missing product id." };

	const admin = createAdminClient();
	const { error } = await admin.from("products").delete().eq("id", id);
	if (error) return { error: error.message };

	revalidate();
	await logActivity("edit", "Products", `Deleted product “${id}”`);
	return { ok: true };
}
