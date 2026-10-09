"use client";

import { useReveal } from "@/hooks/use-reveal";

/*
 * The intro band at the top of every inner page: eyebrow, a two-tone title
 * and a short lead, over a navy ground with a soft brand-blue glow.
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
		<Tag
			data-header-theme="dark"
			className="relative overflow-hidden border-b border-line bg-background pt-40 pb-16 md:pb-20"
		>
			<BrandGlow />
			<div
				ref={scope}
				className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10"
			>
				<Eyebrow data-reveal className="mb-6">
					{eyebrow}
				</Eyebrow>

				<h1
					data-reveal
					className="text-4xl font-bold leading-[0.95] tracking-tighter text-foreground md:text-6xl lg:text-7xl"
				>
					{title}
					{titleAccent && (
						<>
							{" "}
							<span className="font-light italic text-muted">
								{titleAccent}
							</span>
						</>
					)}
				</h1>

				{children && (
					<p
						data-reveal
						className="mt-6 max-w-2xl text-base font-light leading-relaxed text-foreground/75 md:text-lg"
					>
						{children}
					</p>
				)}
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
			<span className="text-[11px] font-bold uppercase tracking-[0.4em] text-accent">
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
