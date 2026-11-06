import { cn } from "@/lib/utils";

/*
 * The admin's shared pieces, in the site's own language: Sora headings, flat solid surfaces, the same fields and the same
 * pastel states as the public forms. No outlines around everything, no eyebrows, no glass. Colours are the site's tokens,
 * so the admin follows the light and dark theme like every other page.
 */

/** A text field: a flat surface that takes the accent ring on focus. */
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
	"inline-flex cursor-pointer items-center gap-1.5 rounded text-sm font-medium text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent";

/** An icon-only action: a 40px target with a visible focus ring. */
export const ICON_BTN =
	"inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50";

/** A destructive text action. */
export const LINK_DANGER =
	"inline-flex cursor-pointer items-center gap-1.5 rounded text-sm font-medium text-muted outline-none transition-colors hover:text-danger-ink focus-visible:ring-2 focus-visible:ring-accent";

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
		<header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
			<div className="min-w-0">
				<h1 className="font-heading text-4xl font-semibold leading-none tracking-[-0.04em] text-foreground md:text-5xl">{title}</h1>
				{children && <div className="mt-4 max-w-2xl text-base text-muted">{children}</div>}
			</div>
			{action}
		</header>
	);
}

/** A flat group of related fields. */
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
		<section className={cn("rounded-xl bg-surface p-6 md:p-8", className)}>
			{(title || aside) && (
				<div className="mb-6 flex items-center justify-between gap-4">
					{title && <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">{title}</h2>}
					{aside}
				</div>
			)}
			{children}
		</section>
	);
}

/** A panel's smaller heading, for a group inside it. */
export function GroupTitle({ children }: { children: React.ReactNode }) {
	return <h3 className="mb-3 font-heading text-base font-semibold tracking-[-0.01em] text-foreground">{children}</h3>;
}

/** A field inside a panel sits on the panel, so it needs the page's colour, not the surface. */
export const FIELD_IN_PANEL =
	"w-full rounded-lg bg-background px-4 py-3 text-[0.9375rem] text-foreground outline-none ring-2 ring-transparent transition-shadow placeholder:text-muted/70 hover:ring-foreground/15 focus:ring-accent disabled:opacity-60";

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
const TONES: Record<Tone, string> = {
	ok: "bg-ok-soft text-ok-ink",
	warn: "bg-warn-soft text-warn-ink",
	danger: "bg-danger-soft text-danger-ink",
	info: "bg-foreground/8 text-foreground",
};
const DOTS: Record<Tone, string> = { ok: "bg-ok", warn: "bg-warn", danger: "bg-danger", info: "bg-muted" };

/** A short status: a pastel with a dot, so it never relies on colour alone. */
export function Status({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
	return (
		<span className={cn("inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium", TONES[tone], className)}>
			<span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone])} />
			{children}
		</span>
	);
}

/** A message in a block, for the page's own state (dev mode, nothing connected, saved, failed). */
export function Notice({ tone = "info", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
	return (
		<p role={tone === "danger" ? "alert" : "status"} className={cn("rounded-lg px-4 py-3 text-sm font-medium", TONES[tone], className)}>
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
