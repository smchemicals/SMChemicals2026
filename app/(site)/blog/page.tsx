import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/cms/blog";

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
			<section className="dark relative bg-background-50 text-text-950 overflow-hidden pt-36 pb-12 border-b border-background-200">
				<div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
					<div className="flex items-center gap-3 mb-5">
						<div className="h-px w-6 bg-accent-500/60" />
						<span className="text-[11px] font-black text-text-400 uppercase tracking-[0.5em]">
							Blog
						</span>
					</div>
					<h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[0.9] text-text-950">
						Insights &amp;{" "}
						<span className="text-text-400 italic font-light">Updates.</span>
					</h1>
					<p className="mt-5 max-w-2xl text-text-400 text-base md:text-lg font-light tracking-wide leading-relaxed">
						Technical notes, application stories and news from the SM Chemicals
						team.
					</p>
				</div>
			</section>

			<section className="flex-1 bg-background-50 py-20 lg:py-28">
				<div className="max-w-7xl mx-auto px-6 lg:px-10">
					{posts.length === 0 ? (
						<p className="text-text-800 text-lg font-light">
							No posts yet — check back soon.
						</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-background-200 border border-background-200">
							{posts.map((p) => (
								<Link
									key={p.id}
									href={`/blog/${p.slug}`}
									className="group flex flex-col bg-background-50 transition-colors hover:bg-background-100"
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
										<span className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-700 mb-3">
											{fmtDate(p.publishedAt)}
										</span>
										<h2 className="text-xl lg:text-2xl font-bold tracking-tight text-text-950 leading-tight mb-3 group-hover:text-accent-700 transition-colors">
											{p.title}
										</h2>
										{p.excerpt && (
											<p className="text-text-800 text-base font-light leading-relaxed line-clamp-3">
												{p.excerpt}
											</p>
										)}
										<span className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-text-950">
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
