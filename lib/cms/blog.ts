import { draftMode } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/cms/products";
import type { BlogPost } from "@/data/blog";
import { sanitizeBody } from "@/lib/security/sanitize";

async function isDraft(): Promise<boolean> {
	try {
		return (await draftMode()).isEnabled;
	} catch {
		return false;
	}
}

type Row = {
	id: string;
	slug: string;
	title: string;
	excerpt: string | null;
	body: string | null;
	cover_image_url: string | null;
	published: boolean;
	published_at: string | null;
};

function map(r: Row): BlogPost {
	return {
		id: r.id,
		slug: r.slug,
		title: r.title,
		excerpt: r.excerpt ?? "",
		body: r.body ?? "",
		coverImage: r.cover_image_url || undefined,
		published: r.published,
		publishedAt: r.published_at,
	};
}

/* What visitors get: the same post with its body cleaned. (The admin reads posts through map() and edits the original.) */
const mapPublic = (r: Row): BlogPost => ({ ...map(r), body: sanitizeBody(r.body ?? "") });

// Public: published posts only, newest first.
export async function getPublishedPosts(): Promise<BlogPost[]> {
	if (!supabaseConfigured()) return [];
	try {
		// Draft mode (staff preview): read via the authed client so RLS lets
		// unpublished posts through, and show every post.
		if (await isDraft()) {
			const db = await createClient();
			const { data } = await db
				.from("blog_posts")
				.select("*")
				.order("created_at", { ascending: false });
			return (data ?? []).map((r) => mapPublic(r as Row));
		}
		const db = createPublicClient();
		const { data } = await db
			.from("blog_posts")
			.select("*")
			.eq("published", true)
			.order("published_at", { ascending: false })
			.retry(false);
		return (data ?? []).map((r) => mapPublic(r as Row));
	} catch {
		return [];
	}
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
	if (!supabaseConfigured()) return null;
	try {
		if (await isDraft()) {
			const db = await createClient();
			const { data } = await db
				.from("blog_posts")
				.select("*")
				.eq("slug", slug)
				.maybeSingle();
			return data ? mapPublic(data as Row) : null;
		}
		const db = createPublicClient();
		const { data } = await db
			.from("blog_posts")
			.select("*")
			.eq("slug", slug)
			.eq("published", true)
			.maybeSingle()
			.retry(false);
		return data ? mapPublic(data as Row) : null;
	} catch {
		return null;
	}
}

// Admin: every post, drafts included (service role).
export async function getAllPosts(): Promise<BlogPost[]> {
	if (!supabaseConfigured()) return [];
	try {
		const admin = createAdminClient();
		const { data } = await admin
			.from("blog_posts")
			.select("*")
			.order("created_at", { ascending: false });
		return (data ?? []).map((r) => map(r as Row));
	} catch {
		return [];
	}
}
