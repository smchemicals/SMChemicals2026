import { cn } from "@/lib/utils";

/*
 * The admin's shared pieces, in the site's own language: Sora headings, flat solid surfaces, the same fields and the same
 * pastel states as the public forms. No outlines around everything, no eyebrows, no glass. Colours are the site's tokens,
 * so the admin follows the light and dark theme like every other page.
 */

/** A text field: a flat fill that takes the accent ring on focus. */
export const FIELD =
	"w-full rounded-lg bg-surface px-4 py-3 text-[0.9375rem] text-foreground outline-none ring-2 ring-transparent transition-shadow placeholder:text-muted/70 hover:ring-foreground/15 focus:ring-accent disabled:opacity-60";

/** A field's label. */
export const LABEL = "text-sm font-medium text-muted";

/** The one solid action. */
export const BTN =
	"inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-cta px-5 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-cta-foreground outline-none transition-colors hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60";

/** A quieter action beside it: a flat surface. */
export const BTN_QUIET =
	"inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-surface px-5 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-foreground outline-none transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60";

/** A small text action inside a row. */
export const LINK_BTN =
	"inline-flex cursor-pointer items-center gap-1.5 rounded text-sm font-medium text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent pointer-coarse:min-h-11 pointer-coarse:px-1.5";

/** An icon-only action: a 40px target with a visible focus ring. */
export const ICON_BTN =
	"inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 pointer-coarse:h-11 pointer-coarse:w-11";

/** A destructive text action: red all the time, so it is never mistaken for a safe one. */
export const LINK_DANGER =
	"inline-flex cursor-pointer items-center gap-1.5 rounded text-sm font-medium text-danger outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 pointer-coarse:min-h-11 pointer-coarse:px-1.5";

/** A destructive icon action (delete, remove). */
export const ICON_DANGER =
	"inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-danger outline-none transition-colors hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 pointer-coarse:h-11 pointer-coarse:w-11";

/** The solid button that confirms a destructive action. */
export const BTN_DANGER =
	"inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-danger px-4 font-heading text-sm font-semibold tracking-[-0.01em] text-background outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60";

/** The title of a page in the admin. */
export function PageHeader({
	title,
	children,
	action,
}: {
	title: string;
	children?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<header className="mb-14 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
			<div className="min-w-0">
				<h1 className="font-heading text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground">{title}</h1>
				{children && <div className="mt-5 max-w-2xl text-lg leading-[1.5] text-muted">{children}</div>}
			</div>
			{action}
		</header>
	);
}

/*
 * A section of a page: a heading, then its content, with space around it. No box, the way the website sets its sections.
 * Pages stack sections with `space-y-16`.
 */
export function Panel({
	title,
	children,
	className,
	aside,
}: {
	title?: string;
	children: React.ReactNode;
	className?: string;
	aside?: React.ReactNode;
}) {
	return (
		<section className={className}>
			{(title || aside) && (
				<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
					{title && <h2 className="font-heading text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-tight tracking-[-0.03em] text-foreground">{title}</h2>}
					{aside}
				</div>
			)}
			{children}
		</section>
	);
}

/** A smaller heading inside a section. */
export function GroupTitle({ children }: { children: React.ReactNode }) {
	return <h3 className="mb-3 font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">{children}</h3>;
}

/** A field sitting inside a repeated entry (a row with the surface fill), so it takes the page colour. */
export const FIELD_ON_SURFACE =
	"w-full rounded-lg bg-background px-4 py-3 text-[0.9375rem] text-foreground outline-none ring-2 ring-transparent transition-shadow placeholder:text-muted/70 hover:ring-foreground/15 focus:ring-accent disabled:opacity-60";

/** A repeated entry in a list of fields (a card, a milestone, a role). The one place a filled block is used. */
export const ENTRY = "rounded-lg bg-surface p-4 md:p-5";

/** A label and the control under it. */
export function Field({
	label,
	hint,
	children,
	className,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<label className={cn("flex flex-col gap-2", className)}>
			<span className={LABEL}>{label}</span>
			{children}
			{hint && <span className="text-sm text-muted/80">{hint}</span>}
		</label>
	);
}

type Tone = "ok" | "warn" | "danger" | "info";
/* The site's pastel states: a soft tint to sit on and a deeper ink to read on it. Green is done, yellow needs a look, red is wrong or final. */
const TONES: Record<Tone, string> = {
	ok: "bg-ok-soft text-ok-ink",
	warn: "bg-warn-soft text-warn-ink",
	danger: "bg-danger-soft text-danger-ink",
	info: "bg-foreground/8 text-foreground",
};

/** A short status or result, said in words on its pastel. */
export function Status({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
	return (
		<span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium", TONES[tone], className)}>{children}</span>
	);
}

/** A message for the page's own state: dev mode, a warning, a failure. */
export function Notice({ tone = "info", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
	return (
		<p role={tone === "danger" ? "alert" : "status"} className={cn("rounded-lg px-4 py-3 text-base font-medium", TONES[tone], className)}>
			{children}
		</p>
	);
}

/** The result of a save, beside the button. */
export function SaveResult({ error, ok }: { error?: string; ok?: string }) {
	if (error) return <Status tone="danger">{error}</Status>;
	if (ok) return <Status tone="ok">{ok}</Status>;
	return null;
}

/** Alias kept for older imports: fields now sit directly on the page, so this is the same as FIELD. */
export const FIELD_IN_PANEL = FIELD;
