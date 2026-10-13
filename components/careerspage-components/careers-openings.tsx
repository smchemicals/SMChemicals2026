"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useSection } from "@/hooks/use-section";
import type { CareersContent } from "@/data/careers";
import { CareerApplyModal } from "./career-apply-modal";
import { Eyebrow } from "@/components/ui/page-hero";
import { CtaSubmit } from "@/components/ui/cta-button";

export function CareersOpenings({ content }: { content: CareersContent }) {
	const { intro: careersIntro, openings } = content;
	const [applyRole, setApplyRole] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);

	const openApply = (role: string | null) => {
		setApplyRole(role);
		setModalOpen(true);
	};

	const introScope = useSection<HTMLDivElement>({
		stagger: 0.1,
		start: "top 85%",
		exitY: -50,
	});
	const listScope = useSection<HTMLDivElement>({
		stagger: 0.08,
		start: "top 88%",
		exitY: -50,
	});

	return (
		<section className="bg-background pt-12 pb-24 lg:pt-16 lg:pb-32">
			<div className="max-w-7xl mx-auto px-6 sm:px-10">
				<div ref={introScope} className="mb-20 lg:mb-28">
					<Eyebrow data-reveal className="mb-6">
						{careersIntro.eyebrow}
					</Eyebrow>
					<h2
						data-reveal
						className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-none mb-8"
					>
						{careersIntro.heading}{" "}
						<span className="text-muted font-light">
							{careersIntro.headingAccent}
						</span>
					</h2>
					<p
						data-reveal
						className="max-w-2xl text-foreground/75 text-lg md:text-xl font-light leading-relaxed mb-16"
					>
						{careersIntro.body}
					</p>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line">
						{careersIntro.values.map((v) => (
							<div
								key={v.title}
								data-cell
								className="bg-background p-8 lg:p-10"
							>
								<h3 className="type-label text-foreground mb-3">
									{v.title}
								</h3>
								<p className="text-foreground/75 text-lg font-light leading-relaxed">
									{v.detail}
								</p>
							</div>
						))}
					</div>
				</div>

				<div className="flex items-end justify-between gap-6 border-b border-line pb-6 mb-10">
					<h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
						Open <span className="text-muted font-light">positions.</span>
					</h2>
					<span className="type-label text-accent-ink tabular-nums">
						{String(openings.length).padStart(2, "0")} Roles
					</span>
				</div>

				{openings.length > 0 ? (
					<div ref={listScope} className="border-t border-l border-line">
						{openings.map((role) => (
							<button
								key={role.id}
								type="button"
								onClick={() => openApply(role.title)}
								data-cell
								className="group flex w-full flex-col gap-4 border-b border-r border-line p-8 lg:p-10 text-left transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between cursor-pointer"
							>
								<div className="min-w-0">
									<h3 className="font-heading text-xl lg:text-2xl font-semibold tracking-tight text-foreground mb-3">
										{role.title}
									</h3>
									<div className="type-label flex flex-wrap gap-x-5 gap-y-1 text-accent-ink mb-4">
										<span>{role.department}</span>
										<span>{role.type}</span>
										<span>{role.location}</span>
									</div>
									<p className="max-w-xl text-foreground/75 text-lg font-light leading-relaxed">
										{role.description}
									</p>
								</div>
								<div className="type-label flex items-center gap-2 shrink-0 text-foreground group-hover:text-accent-ink transition-colors">
									Apply
									<ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
								</div>
							</button>
						))}
					</div>
				) : (
					<p className="text-foreground/75 text-lg font-light">
						No open roles right now.
					</p>
				)}

				{/* General application */}
				<div className="mt-16 flex flex-col items-start gap-4 border-t border-line pt-12 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-foreground/75 text-base font-light max-w-md">
						Don&apos;t see the right role? We still want to hear from strong
						people.
					</p>
					<CtaSubmit type="button" onClick={() => openApply(null)}>
						Send a general application
						<ArrowUpRight className="w-4 h-4" />
					</CtaSubmit>
				</div>
			</div>

			{modalOpen && (
				<CareerApplyModal
					roleTitle={applyRole}
					onClose={() => setModalOpen(false)}
				/>
			)}
		</section>
	);
}
