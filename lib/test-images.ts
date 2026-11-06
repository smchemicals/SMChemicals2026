/*
 * Local placeholder product photos, for building and reviewing the product
 * pages without the real images from Supabase. They are used only in
 * development, and only for products that have no image of their own, so a
 * production build never shows them.
 */
const FILES = ["drum", "bottle", "bag", "can"] as const;

export function testImageFor(id: string): string | undefined {
	if (process.env.NODE_ENV === "production") return undefined;
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
	return `/test-products/${FILES[h % FILES.length]}.svg`;
}
