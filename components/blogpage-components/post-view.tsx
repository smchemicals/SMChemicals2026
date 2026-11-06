"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openInquiry } from "@/lib/inquiry";
import { gsap } from "@/lib/gsap";
import { useReveal } from "@/hooks/use-reveal";
import { LiquidField } from "@/components/ui/liquid-field";
import type { BlogPost } from "@/data/blog";

/* Article typography: a comfortable reading size, headings in the display face. */
const BODY =
	"text-xl leading-[1.75] text-foreground/85 " +
	"[&_h1]:mb-5 [&_h1]:mt-14 [&_h1]:font-heading [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-[-0.035em] [&_h1]:text-foreground " +
	"[&_h2]:mb-5 [&_h2]:mt-14 [&_h2]:font-heading [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h2]:text-foreground " +
	"[&_h3]:mb-4 [&_h3]:mt-10 [&_h3]:font-heading [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-[-0.025em] [&_h3]:text-foreground " +
	"[&_p]:mb-6 [&_u]:underline [&_s]:line-through [&_mark]:rounded [&_mark]:bg-accent/30 [&_mark]:px-0.5 " +
	"[&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-4 " +
	"[&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] " +
	"[&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-surface [&_pre]:p-5 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:text-foreground " +
	"[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-12 [&_hr]:border-0 " +
	"[&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 " +
	"[&_strong]:font-semibold [&_strong]:text-foreground [&_img]:my-8 [&_img]:max-w-full [&_img]:rounded-2xl " +
	"[&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-6 [&_blockquote]:font-heading [&_blockquote]:text-2xl [&_blockquote]:font-medium [&_blockquote]:leading-snug [&_blockquote]:tracking-[-0.02em] [&_blockquote]:text-foreground " +
	"[&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-surface [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_td]:p-3 [&_tr]:even:bg-surface/50";

export function PostView({ post, date }: { post: BlogPost; date: string }) {
	const root = useRef<HTMLElement>(null);
	const ctaScope = useReveal<HTMLDivElement>({ y: 20, blur: 0, duration: 1, stagger: 0.1, scroll: true, start: "top 80%" });

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap.from("[data-in]", { autoAlpha: 0, y: 28, duration: 1.1, stagger: 0.1, ease: "expoOut" });
			});
		},
		{ scope: root },
	);

	return (
		<article>
			<header
				ref={root}
				data-surface="hero"
				className="relative flex min-h-[70svh] flex-col justify-end overflow-hidden bg-background text-foreground"
			>
				<LiquidField />
				<div className="relative mx-auto w-full max-w-4xl px-6 pb-14 pt-40 sm:px-10 lg:pb-20">
					<Link
						data-in
						href="/blog"
						className="group/b inline-flex items-center gap-2 text-base font-medium text-foreground/75 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
					>
						<ArrowLeft aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover/b:-translate-x-1" />
						All articles
					</Link>
					<p data-in className="mt-10 text-base text-foreground/70">
						{date}
					</p>
					<h1 data-in className="mt-4 font-heading text-[clamp(2.25rem,6vw,5.5rem)] font-semibold leading-none tracking-[-0.03em] text-foreground">
						{post.title}
					</h1>
					{post.excerpt && (
						<p data-in className="mt-8 max-w-2xl text-xl leading-[1.55] text-foreground/75">
							{post.excerpt}
						</p>
					)}
				</div>
			</header>

			<div className="bg-background pb-24 pt-16 lg:pb-32 lg:pt-24">
				<div className="mx-auto max-w-3xl px-6 sm:px-10">
					{post.coverImage && (
						<div className="mb-14 overflow-hidden rounded-3xl">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={post.coverImage} alt={post.title} className="w-full object-cover" />
						</div>
					)}
					<div className={BODY} dangerouslySetInnerHTML={{ __html: post.body }} />
				</div>
			</div>

			<section data-header="light" className="overflow-hidden bg-cta text-cta-foreground">
				<div ref={ctaScope} className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24 sm:px-10 md:flex-row md:items-end md:justify-between lg:py-32">
					<h2 data-reveal className="font-heading text-[clamp(2.25rem,6vw,5.5rem)] font-semibold leading-[0.95] tracking-tighter">
						Have a question
						<br />
						for our team?
					</h2>
					<Button data-reveal variant="light" size="lg" arrow="up-right" onClick={() => openInquiry("article")} className="self-start md:self-auto">
						Get in touch
					</Button>
				</div>
			</section>
		</article>
	);
}
