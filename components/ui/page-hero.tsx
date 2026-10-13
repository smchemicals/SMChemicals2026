"use client";

import { useReveal } from "@/hooks/use-reveal";

/*
 * The intro band at the top of every inner page: eyebrow, a two-tone title
 * and a short lead over the ice ground with a soft brand-blue glow. On wide
 * screens the lead sits in a right-hand column, aligned to the title's base.
 * The title is the largest type on the page, above every section heading.
 */
export function PageHero({
	eyebrow,
	title,
	titleAccent,
	children,
	as: Tag = "section",
}: {
	eyebrow: string;
	title: React.ReactNode;
	titleAccent?: React.ReactNode;
	children?: React.ReactNode;
	as?: "section" | "header";
}) {
	const scope = useReveal<HTMLDivElement>({ y: 16, blur: 4, stagger: 0.08 });

	return (
		<Tag className="relative overflow-hidden bg-background pt-36 pb-12 md:pt-44 md:pb-16">
			<BrandGlow className="[mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
			<div ref={scope} className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10">
				<Eyebrow data-reveal className="mb-8">
					{eyebrow}
				</Eyebrow>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
					<h1
						data-reveal
						className="text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-6xl md:text-7xl lg:col-span-7 lg:text-8xl"
					>
						{title}
						{titleAccent && (
							<>
								{" "}
								<span className="font-light text-muted">
									{titleAccent}
								</span>
							</>
						)}
					</h1>

					{children && (
						<p
							data-reveal
							className="max-w-xl text-base font-light leading-relaxed text-foreground/75 md:text-lg lg:col-span-5 lg:pb-2"
						>
							{children}
						</p>
					)}
				</div>
			</div>
		</Tag>
	);
}

/* Small label above a heading: a blue rule and spaced capitals. */
export function Eyebrow({
	children,
	className = "",
	...rest
}: React.ComponentProps<"div">) {
	return (
		<div className={`flex items-center gap-3 ${className}`} {...rest}>
			<span className="h-px w-8 bg-accent" />
			<span className="type-label text-accent-ink">
				{children}
			</span>
		</div>
	);
}

/* Soft blue glow + dot grid that sits behind dark brand sections. */
export function BrandGlow({ className = "" }: { className?: string }) {
	return (
		<div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
			<div className="absolute -top-1/3 right-[-10%] h-[42rem] w-[42rem] rounded-full bg-accent/15 blur-[120px]" />
			<div className="absolute -bottom-1/2 left-[-15%] h-[36rem] w-[36rem] rounded-full bg-sky/5 blur-[120px]" />
			<div
				className="absolute inset-0 opacity-[0.07] [mask-image:linear-gradient(to_bottom,black,transparent)]"
				style={{
					backgroundImage:
						"radial-gradient(circle at center, var(--color-foreground) 1px, transparent 1px)",
					backgroundSize: "32px 32px",
				}}
			/>
		</div>
	);
}
