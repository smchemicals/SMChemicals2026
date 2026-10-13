import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getAllPosts } from "@/lib/cms/blog";
import { BlogManager } from "./BlogManager";

export const metadata = { title: "Blog" };

export default async function BlogAdmin() {
	await requirePermission("blog");
	const posts = await getAllPosts();

	return (
		<div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
			<div className="mb-12">
				<div className="mb-5 flex items-center gap-3">
					<span className="h-px w-7 bg-accent-500" />
					<span className="type-label text-accent-500">
						Blog
					</span>
				</div>
				<h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight leading-none">
					Blog<span className="text-white/50 font-light">.</span>
				</h1>
				<p className="mt-6 text-white/65 text-sm font-light tracking-wide">
					Write and format posts in the editor. A post goes live on the site as
					soon as it&apos;s marked Published.
				</p>
				{DEV_BYPASS && (
					<p className="mt-4 inline-block border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-amber-300 text-xs font-medium tracking-wide">
						Dev mode — connect Supabase to save posts.
					</p>
				)}
			</div>

			<BlogManager posts={posts} />
		</div>
	);
}
