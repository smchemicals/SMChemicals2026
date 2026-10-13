import { draftMode } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/cms/settings";
import {
	getCatalog,
	supabaseConfigured,
	withPopularDefaults,
} from "@/lib/cms/products";
import { diffData } from "@/lib/cms/diff";
import {
	defaultHome,
	defaultContact,
	type HomeContent,
	type ContactContent,
} from "@/data/content";
import { defaultAbout, type AboutContent } from "@/data/about";
import { defaultCareers, type CareersContent } from "@/data/careers";
import { productCategories, type ProductCategory } from "@/data/products";

export const SNAPSHOT_KEYS = [
	"home",
	"contact",
	"about",
	"careers",
	"products",
] as const;
export type SnapshotKey = (typeof SNAPSHOT_KEYS)[number];

export const SNAPSHOT_LABELS: Record<SnapshotKey, string> = {
	home: "Home",
	contact: "Contact",
	about: "About",
	careers: "Careers",
	products: "Products",
};

export const SNAPSHOT_PATHS: Record<SnapshotKey, string> = {
	home: "/",
	contact: "/contact",
	about: "/about",
	careers: "/careers",
	products: "/products",
};

// Builds the DRAFT payload for a section straight from the live source
// (site_settings / product tables). This is what an admin is currently editing.
export async function buildDraft(key: SnapshotKey): Promise<unknown> {
	switch (key) {
		case "home":
			return getSetting<HomeContent>("home", defaultHome);
		case "contact":
			return getSetting<ContactContent>("contact", defaultContact);
		case "about":
			return getSetting<AboutContent>("about", defaultAbout);
		case "careers":
			return getSetting<CareersContent>("careers", defaultCareers);
		case "products":
			return getCatalog();
	}
}

// Raw source rows kept alongside a snapshot so a draft can be reverted to the
// last published state. Settings sections store their value directly; products
// store the underlying table rows.
export async function captureRaw(key: SnapshotKey): Promise<unknown> {
	if (key !== "products") return buildDraft(key);
	const supabase = await createClient();
	const [{ data: cats }, { data: prods }] = await Promise.all([
		supabase.from("product_categories").select("*"),
		supabase.from("products").select("*"),
	]);
	return { product_categories: cats ?? [], products: prods ?? [] };
}

async function published<T>(key: SnapshotKey): Promise<T | null> {
	if (!supabaseConfigured()) return null;
	try {
		const db = createPublicClient();
		const { data } = await db
			.from("page_snapshots")
			.select("data")
			.eq("page", key)
			.maybeSingle();
		return (data?.data as T) ?? null;
	} catch {
		return null;
	}
}

// In Draft Mode (staff clicked "Preview draft") the public pages read the live
// DRAFT instead of the published snapshot, so unpublished edits are visible.
async function isDraft(): Promise<boolean> {
	try {
		return (await draftMode()).isEnabled;
	} catch {
		return false;
	}
}

// Public-site reads: the published snapshot, falling back to the static
// defaults so the site always renders (pre-publish, or with no Supabase).
export const getPublishedHome = async (): Promise<HomeContent> =>
	(await isDraft())
		? getSetting<HomeContent>("home", defaultHome)
		: ((await published<HomeContent>("home")) ?? defaultHome);
export const getPublishedContact = async (): Promise<ContactContent> =>
	(await isDraft())
		? getSetting<ContactContent>("contact", defaultContact)
		: ((await published<ContactContent>("contact")) ?? defaultContact);
export const getPublishedAbout = async (): Promise<AboutContent> =>
	(await isDraft())
		? getSetting<AboutContent>("about", defaultAbout)
		: ((await published<AboutContent>("about")) ?? defaultAbout);
export const getPublishedCareers = async (): Promise<CareersContent> =>
	(await isDraft())
		? getSetting<CareersContent>("careers", defaultCareers)
		: ((await published<CareersContent>("careers")) ?? defaultCareers);
export const getPublishedCatalog = async (): Promise<ProductCategory[]> =>
	(await isDraft())
		? getCatalog()
		: withPopularDefaults(
				(await published<ProductCategory[]>("products")) ?? productCategories,
			);

export type PageStatus = "unpublished" | "clean" | "dirty";

export interface PageDraft {
	key: SnapshotKey;
	label: string;
	path: string;
	publishedAt: string | null;
	status: PageStatus;
	changes: string[];
}

export async function getDrafts(): Promise<PageDraft[]> {
	const snaps = new Map<
		string,
		{ data: unknown; published_at: string }
	>();
	if (supabaseConfigured()) {
		try {
			const db = createPublicClient();
			const { data } = await db
				.from("page_snapshots")
				.select("page, data, published_at");
			for (const r of data ?? [])
				snaps.set((r as { page: string }).page, r as never);
		} catch {
			/* fall through to unpublished rows */
		}
	}

	const rows: PageDraft[] = [];
	for (const key of SNAPSHOT_KEYS) {
		const draft = await buildDraft(key);
		const snap = snaps.get(key);
		if (!snap) {
			rows.push({
				key,
				label: SNAPSHOT_LABELS[key],
				path: SNAPSHOT_PATHS[key],
				publishedAt: null,
				status: "unpublished",
				changes: [],
			});
			continue;
		}
		// Catalog snapshots published before the `popular` flag existed get the
		// same defaults the public site uses, so only real edits count.
		const published =
			key === "products" && Array.isArray(snap.data)
				? withPopularDefaults(snap.data as ProductCategory[])
				: snap.data;
		const changes = diffData(published, draft);
		rows.push({
			key,
			label: SNAPSHOT_LABELS[key],
			path: SNAPSHOT_PATHS[key],
			publishedAt: snap.published_at,
			status: changes.length ? "dirty" : "clean",
			changes,
		});
	}
	return rows;
}
