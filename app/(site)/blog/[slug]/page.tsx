import type { Metadata } from "next";
import { PostView } from "@/components/blogpage-components/post-view";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/cms/blog";
import { SITE } from "@/lib/site";

function fmtDate(iso: string | null) {
	if (!iso) return "";
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) return { title: "Post not found" };
	return {
		title: post.title,
		description: post.excerpt,
		alternates: { canonical: `/blog/${post.slug}` },
		openGraph: {
			type: "article",
			title: post.title,
			description: post.excerpt,
			url: `/blog/${post.slug}`,
			publishedTime: post.publishedAt ?? undefined,
			// Without a cover image, the generated card (opengraph-image) is used.
			...(post.coverImage ? { images: [post.coverImage] } : {}),
		},
		twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
	};
}

export default async function PostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) notFound();

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.excerpt,
		datePublished: post.publishedAt ?? undefined,
		mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
		image: post.coverImage ?? `${SITE.url}/blog/${post.slug}/opengraph-image`,
		author: { "@type": "Organization", name: SITE.name },
		publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: `${SITE.url}/smc_logo.png` } },
	};

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<PostView post={post} date={fmtDate(post.publishedAt)} />
		</>
	);
}
