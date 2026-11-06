import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getPublishedPosts } from "@/lib/cms/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const routes = ["", "/products", "/about", "/blog", "/careers", "/contact", "/privacy"];
	const now = new Date();
	const pages: MetadataRoute.Sitemap = routes.map((path) => ({
		url: `${SITE.url}${path}`,
		lastModified: now,
		changeFrequency: path === "" ? "weekly" : "monthly",
		priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.7,
	}));
	// Posts come from the CMS; if it can't be reached the static pages still ship.
	const posts = await getPublishedPosts().catch(() => []);
	return [
		...pages,
		...posts.map((p) => ({
			url: `${SITE.url}/blog/${p.slug}`,
			lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
			changeFrequency: "monthly" as const,
			priority: 0.6,
		})),
	];
}
