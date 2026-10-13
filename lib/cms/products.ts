import {
	productCategories,
	type ProductCategory,
	type ProductSpec,
} from "@/data/products";
import { createClient } from "@/lib/supabase/server";

export function supabaseConfigured() {
	return Boolean(
		process.env.NEXT_PUBLIC_SUPABASE_URL &&
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	);
}

/* Categories badged "Popular" before the flag lived in the database. Used
   for the static fallback and for published snapshots taken before the
   `popular` column existed (supabase/migrations/0009_category_popular.sql). */
const DEFAULT_POPULAR = new Set(["water-boiler", "ro", "etp", "cooling"]);

export function withPopularDefaults(
	categories: ProductCategory[],
): ProductCategory[] {
	if (categories.some((c) => typeof c.popular === "boolean")) return categories;
	return categories.map((c) => ({ ...c, popular: DEFAULT_POPULAR.has(c.id) }));
}

// Reads the catalog from Supabase when configured; otherwise (and in dev
// bypass with no Supabase) falls back to the static `data/products.ts` so the
// public site and admin still render.
export async function getCatalog(): Promise<ProductCategory[]> {
	if (!supabaseConfigured()) return withPopularDefaults(productCategories);
	try {
		const supabase = await createClient();
		const categoriesQuery = (columns: string) =>
			supabase
				.from("product_categories")
				.select(columns)
				.order("sort_order", { ascending: true });

		const [catsRes, { data: prods }] = await Promise.all([
			categoriesQuery("id, name, blurb, sort_order, popular"),
			supabase
				.from("products")
				.select("id, category_id, name, description, spec, image_url, sort_order")
				.order("sort_order", { ascending: true }),
		]);
		// Before migration 0009 the `popular` column doesn't exist; read the
		// catalog without it rather than losing it.
		let cats = catsRes.data as Record<string, unknown>[] | null;
		if (catsRes.error)
			cats = (await categoriesQuery("id, name, blurb, sort_order")).data as
				| Record<string, unknown>[]
				| null;

		if (!cats || cats.length === 0) return withPopularDefaults(productCategories);

		return withPopularDefaults(
			cats.map((c) => ({
				id: c.id as string,
				name: c.name as string,
				blurb: (c.blurb as string) ?? "",
				popular: typeof c.popular === "boolean" ? c.popular : undefined,
				products: (prods ?? [])
					.filter((p) => p.category_id === c.id)
					.map((p) => ({
						id: p.id as string,
						name: p.name as string,
						description: (p.description as string) ?? "",
						spec: (p.spec as ProductSpec) ?? {},
						image: (p.image_url as string) || undefined,
					})),
			})),
		);
	} catch {
		return withPopularDefaults(productCategories);
	}
}

export function catalogTotals(categories: ProductCategory[]) {
	return {
		categories: categories.length,
		products: categories.reduce((n, c) => n + c.products.length, 0),
	};
}
