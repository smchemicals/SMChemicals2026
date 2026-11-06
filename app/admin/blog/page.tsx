import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getAllPosts } from "@/lib/cms/blog";
import { BlogManager } from "./BlogManager";
import { PageHeader, Notice } from "@/components/admin/ui";

export const metadata = { title: "Blog" };

export default async function BlogAdmin() {
	await requirePermission("blog");
	const posts = await getAllPosts();

	return (
		<div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Blog">
				Write and format posts in the editor. A post goes live as soon as it is marked Published.
			</PageHeader>
			{DEV_BYPASS && <Notice tone="warn" className="mb-8">Dev mode: connect Supabase to save posts.</Notice>}

			<BlogManager posts={posts} />
		</div>
	);
}
