import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/cms/blog";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
	title: "Blog",
	description:
		"News, insights and technical notes from SM Chemicals — industrial chemistry, applications and company updates.",
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

	return (
		<div data-header-theme="dark" className="flex flex-1 flex-col">
			<PageHero eyebrow="Blog" title="Insights &" titleAccent="Updates.">
				Technical notes, application stories and news from the SM Chemicals
				team.
			</PageHero>

			<section className="flex-1 bg-background py-20 lg:py-28">
				<div className="max-w-7xl mx-auto px-6 lg:px-10">
					{posts.length === 0 ? (
						<p className="text-foreground/75 text-lg font-light">
							No posts yet — check back soon.
						</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
							{posts.map((p) => (
								<Link
									key={p.id}
									href={`/blog/${p.slug}`}
									className="group flex flex-col bg-background transition-colors hover:bg-surface"
								>
									{p.coverImage && (
										<div className="overflow-hidden">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={p.coverImage}
												alt={p.title}
												className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
											/>
										</div>
									)}
									<div className="flex flex-1 flex-col p-7 lg:p-8">
										<span className="text-[11px] font-black uppercase tracking-[0.3em] text-accent mb-3">
											{fmtDate(p.publishedAt)}
										</span>
										<h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground leading-tight mb-3 group-hover:text-accent transition-colors">
											{p.title}
										</h2>
										{p.excerpt && (
											<p className="text-foreground/75 text-base font-light leading-relaxed line-clamp-3">
												{p.excerpt}
											</p>
										)}
										<span className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-foreground">
											Read
											<span className="transition-transform duration-300 group-hover:translate-x-1">
												→
											</span>
										</span>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
