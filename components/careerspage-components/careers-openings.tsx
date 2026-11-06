"use client";

import { useState } from "react";
import { useReveal } from "@/hooks/use-reveal";
import type { CareersContent, JobOpening } from "@/data/careers";
import { CareerApplyModal } from "./career-apply-modal";
import { Button } from "@/components/ui/button";
import { IndexList } from "@/components/ui/index-list";

export function CareersOpenings({ content }: { content: CareersContent }) {
	const { intro, openings } = content;
	const [role, setRole] = useState<JobOpening | null>(null);
	const [general, setGeneral] = useState(false);
	const open = role !== null || general;
	// One role open at a time; the first starts open so the page never reads as an empty list.
	const [expanded, setExpanded] = useState<string | null>(openings[0]?.id ?? null);

	const reveal = { y: 20, blur: 0, duration: 1, stagger: 0.1, scroll: true, start: "top 85%" } as const;
	const listScope = useReveal<HTMLDivElement>({ ...reveal, stagger: 0.07 });
	const ctaScope = useReveal<HTMLDivElement>({ ...reveal, start: "top 75%" });

	return (
		<>
			<section data-surface="inverse" className="bg-background pb-12 pt-24 text-foreground lg:pb-20 lg:pt-36">
				<div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:gap-x-10">
					{/* The same split as the footer and every list: text on the left, the points from column 8. */}
					<p className="max-w-xl text-pretty font-heading text-[clamp(1.375rem,2.1vw,1.875rem)] font-medium leading-[1.35] tracking-[-0.02em] lg:col-span-6">
						{intro.body}
					</p>
					<div className="lg:col-span-5 lg:col-start-8">
						<IndexList items={intro.values.map((v) => ({ lead: v.title, text: v.detail }))} />
					</div>
				</div>
			</section>

			<section id="roles" data-surface="inverse" className="bg-background pb-24 pt-20 text-foreground lg:pb-36 lg:pt-32">
				<div ref={listScope} className="mx-auto max-w-7xl px-6 sm:px-10">
					<h2
						data-reveal
						className="font-heading text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-none tracking-[-0.03em]"
					>
						Open <span className="text-accent">positions.</span>
					</h2>

					{openings.length > 0 ? (
						<ul className="mt-12 lg:mt-16">
							{openings.map((r) => {
								const isOpen = expanded === r.id;
								return (
									<li key={r.id} data-reveal>
										<button
											type="button"
											aria-expanded={isOpen}
											aria-controls={`role-${r.id}`}
											onClick={() => setExpanded(isOpen ? null : r.id)}
											className="group/r flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left outline-none focus-visible:text-accent-ink lg:py-8"
										>
											<span className="min-w-0">
												<span
													className={`block font-heading text-[clamp(1.75rem,4.4vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] transition-colors duration-300 ${isOpen ? "text-foreground" : "group-hover/r:text-accent-ink"}`}
												>
													{r.title}
												</span>
												<span className="mt-2 block text-base text-muted">
													{r.department} · {r.location}
												</span>
											</span>
											<span aria-hidden className="relative h-6 w-6 shrink-0 text-accent-ink">
												<span className="absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 rounded bg-current" />
												<span className={`absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 rounded bg-current transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${isOpen ? "rotate-0" : "rotate-90"}`} />
											</span>
										</button>

										<div
											id={`role-${r.id}`}
											role="region"
											aria-label={r.title}
											className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
										>
											<div className="overflow-hidden" inert={!isOpen}>
												<div className="pb-8 lg:pb-10">
													<p className="max-w-2xl text-xl leading-[1.6] text-muted">{r.description}</p>
													<dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
														{[
															["Department", r.department],
															["Location", r.location],
															["Type", r.type],
														].map(([k, v]) => (
															<div key={k}>
																<dt className="text-sm text-muted">{k}</dt>
																<dd className="mt-1 text-lg font-medium">{v}</dd>
															</div>
														))}
													</dl>
													<Button variant="primary" size="lg" arrow="up-right" className="mt-10" onClick={() => setRole(r)}>
														Apply for this role
													</Button>
												</div>
											</div>
										</div>
									</li>
								);
							})}
						</ul>
					) : (
						<p data-reveal className="mt-10 text-xl text-muted">
							There are no open roles right now. Check back soon, or send a general application below.
						</p>
					)}
				</div>
			</section>

			<section data-header="light" className="overflow-hidden bg-cta text-cta-foreground">
				<div ref={ctaScope} className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-24 sm:px-10 md:flex-row md:items-end md:justify-between lg:py-36">
					<div>
						<h2
							data-reveal
							className="font-heading text-[clamp(2.5rem,7vw,7rem)] font-semibold leading-[0.95] tracking-tighter"
						>
							Don&apos;t see the
							<br />
							right role?
						</h2>
						<p data-reveal className="mt-6 max-w-md text-xl leading-[1.55] text-white/80">
							We still want to hear from strong people. Send us your details and we will keep them on file.
						</p>
					</div>
					<Button data-reveal variant="light" size="lg" arrow="up-right" className="self-start md:self-auto" onClick={() => setGeneral(true)}>
						Send a general application
					</Button>
				</div>
			</section>

			{open && (
				<CareerApplyModal
					roleTitle={role?.title ?? null}
					roleDescription={role?.description ?? null}
					onClose={() => {
						setRole(null);
						setGeneral(false);
					}}
				/>
			)}
		</>
	);
}
