"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";

export type BlogState = { ok?: string; error?: string };
export type RowResult = { ok?: boolean; error?: string };

const DEV_NOTICE = "Dev mode, connect Supabase to save posts.";

function slugify(s: string): string {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function savePost(
	_prev: BlogState,
	formData: FormData,
): Promise<BlogState> {
	await requirePermission("blog");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const id = String(formData.get("id") ?? "").trim();
	const title = String(formData.get("title") ?? "").trim();
	if (!title) return { error: "Title is required." };

	const base = slugify(String(formData.get("slug") ?? "") || title) || "post";
	const excerpt = String(formData.get("excerpt") ?? "").trim();
	const body = String(formData.get("body") ?? "");
	const cover = String(formData.get("cover_image_url") ?? "").trim() || null;
	const publishedRaw = formData.get("published");
	const published = publishedRaw === "on" || publishedRaw === "true";

	const admin = createAdminClient();

	// Ensure the slug is unique (ignoring this post's own row).
	let slug = base;
	for (let n = 2; ; n++) {
		const { data } = await admin
			.from("blog_posts")
			.select("id")
			.eq("slug", slug)
			.maybeSingle();
		if (!data || data.id === id) break;
		slug = `${base}-${n}`;
	}

	let publishedAt: string | null = null;
	if (published) {
		if (id) {
			const { data: existing } = await admin
				.from("blog_posts")
				.select("published_at")
				.eq("id", id)
				.maybeSingle();
			publishedAt = existing?.published_at ?? new Date().toISOString();
		} else {
			publishedAt = new Date().toISOString();
		}
	}

	const payload = {
		slug,
		title,
		excerpt,
		body,
		cover_image_url: cover,
		published,
		published_at: publishedAt,
	};

	const { error } = id
		? await admin.from("blog_posts").update(payload).eq("id", id)
		: await admin.from("blog_posts").insert(payload);
	if (error) return { error: error.message };

	revalidatePath("/blog");
	revalidatePath(`/blog/${slug}`);
	revalidatePath("/sitemap.xml");
	revalidatePath("/admin/blog");
	await logActivity("edit", "Blog", `${published ? "Published" : "Saved"} “${title}”`);
	return { ok: "Saved." };
}

export async function deletePost(id: string): Promise<RowResult> {
	await requirePermission("blog");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (!id) return { error: "Missing post id." };

	const admin = createAdminClient();
	const { error } = await admin.from("blog_posts").delete().eq("id", id);
	if (error) return { error: error.message };

	revalidatePath("/blog");
	revalidatePath("/sitemap.xml");
	revalidatePath("/admin/blog");
	await logActivity("edit", "Blog", "Deleted a post");
	return { ok: true };
}
