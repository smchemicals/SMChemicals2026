import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/cms/blog";
import { BlogIndex } from "@/components/blogpage-components/blog-index";

export const metadata: Metadata = {
	title: "Blog",
	description:
		"News, insights and technical notes from SM Chemicals on industrial chemistry, applications and company updates.",
	alternates: { canonical: "/blog" },
};

function fmtDate(iso: string | null) {
	if (!iso) return "";
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export default async function BlogPage() {
	const posts = await getPublishedPosts();
	return <BlogIndex posts={posts.map((p) => ({ ...p, date: fmtDate(p.publishedAt) }))} />;
}
