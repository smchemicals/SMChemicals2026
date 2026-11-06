"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { PageHero } from "@/components/ui/page-hero";
import type { BlogPost } from "@/data/blog";

type Post = BlogPost & { date: string };

/* An arrow in a circle; the glyph leaves top-right as a new one arrives from bottom-left. Parent needs group/p. */
function ArrowDisc({ tone }: { tone: "light" | "dark" }) {
	const cls = "absolute h-5 w-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]";
	return (
		<span
			aria-hidden
			className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full lg:h-14 lg:w-14 ${
				tone === "light" ? "bg-white text-deep" : "bg-cta text-white"
			}`}
		>
			<ArrowUpRight strokeWidth={2} className={`${cls} group-hover/p:translate-x-8 group-hover/p:-translate-y-8 group-focus-visible/p:translate-x-8 group-focus-visible/p:-translate-y-8`} />
			<ArrowUpRight strokeWidth={2} className={`${cls} -translate-x-8 translate-y-8 group-hover/p:translate-x-0 group-hover/p:translate-y-0 group-focus-visible/p:translate-x-0 group-focus-visible/p:translate-y-0`} />
		</span>
	);
}

export function BlogIndex({ posts }: { posts: Post[] }) {
	const featureScope = useReveal<HTMLDivElement>({ y: 20, blur: 0, duration: 1, stagger: 0.1, scroll: true, start: "top 85%" });
	const listScope = useReveal<HTMLDivElement>({ y: 20, blur: 0, duration: 1, stagger: 0.08, scroll: true, start: "top 85%" });
	const [lead, ...rest] = posts;

	return (
		<>
			<PageHero lines={["Insights &", "updates."]} lede="Technical notes, application stories and news from the SM Chemicals team." />

			<section data-surface="inverse" className="bg-background pb-24 pt-8 text-foreground lg:pb-36 lg:pt-12">
				<div ref={featureScope} className="mx-auto max-w-7xl px-6 sm:px-10">
					{lead ? (
						<Link
							href={`/blog/${lead.slug}`}
							className="group/p grid items-center gap-10 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-sky lg:grid-cols-12 lg:gap-16"
						>
							<div className={lead.coverImage ? "lg:col-span-7" : "lg:col-span-12"}>
								<p data-reveal className="text-base text-muted">
									Latest · {lead.date}
								</p>
								<h2
									data-reveal
									className="mt-4 font-heading text-[clamp(2.25rem,5.4vw,5rem)] font-semibold leading-[1.02] tracking-[-0.03em] transition-colors duration-300 group-hover/p:text-accent-ink"
								>
									{lead.title}
								</h2>
								{lead.excerpt && (
									<p data-reveal className="mt-6 max-w-xl text-xl leading-[1.55] text-muted">
										{lead.excerpt}
									</p>
								)}
								<span data-reveal className="mt-10 inline-flex items-center gap-4 font-heading text-lg font-semibold tracking-[-0.02em]">
									<ArrowDisc tone="light" />
									Read the article
								</span>
							</div>
							{lead.coverImage && (
								<div data-reveal className="overflow-hidden rounded-3xl lg:col-span-5">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={lead.coverImage} alt="" className="aspect-4/3 w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/p:scale-[1.04]" />
								</div>
							)}
						</Link>
					) : (
						<p data-reveal className="font-heading text-[clamp(1.75rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
							No posts yet. Check back soon.
						</p>
					)}
				</div>
			</section>

			{rest.length > 0 && (
				<section className="bg-background py-24 text-foreground lg:py-36">
					<div ref={listScope} className="mx-auto max-w-7xl px-6 sm:px-10">
						<h2 data-reveal className="font-heading text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-none tracking-[-0.03em]">
							More <span className="text-accent-ink">articles.</span>
						</h2>
						<ul className="mt-12 grid gap-2 lg:mt-16">
							{rest.map((p) => (
								<li key={p.id} data-reveal>
									<Link
										href={`/blog/${p.slug}`}
										className="group/p grid items-center gap-5 rounded-3xl px-4 py-6 outline-none transition-colors duration-300 hover:bg-surface focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent sm:px-6 md:grid-cols-12 md:gap-8 lg:py-7"
									>
										<span className="text-base text-muted md:col-span-2">{p.date}</span>
										<span className={p.coverImage ? "md:col-span-6" : "md:col-span-9"}>
											<span className="block font-heading text-[clamp(1.5rem,2.8vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.035em]">
												{p.title}
											</span>
											{p.excerpt && (
												<span className="mt-3 line-clamp-2 block max-w-xl text-lg leading-[1.55] text-muted">
													{p.excerpt}
												</span>
											)}
										</span>
										{p.coverImage && (
											<span className="hidden overflow-hidden rounded-2xl md:col-span-3 md:block">
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img src={p.coverImage} alt="" className="aspect-4/3 w-full object-cover" />
											</span>
										)}
										<span className="md:col-span-1 md:justify-self-end">
											<ArrowDisc tone="dark" />
										</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			)}
		</>
	);
}
