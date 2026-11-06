import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDrafts, type SnapshotKey, type PageStatus } from "@/lib/cms/snapshots";
import { getCatalog, catalogTotals } from "@/lib/cms/products";
import { getAllPosts } from "@/lib/cms/blog";
import { getActivityLog, ACTION_LABELS } from "@/lib/cms/activity";
import { BTN, LINK_BTN, PageHeader, Panel, Status } from "@/components/admin/ui";
import { formatDate } from "@/lib/format-date";

export const metadata = { title: "Overview" };

const SECTIONS: { label: string; note: string; href: string; view: string; keys: SnapshotKey[]; section: string }[] = [
	{ label: "Products", note: "Industries and the chemicals under them", href: "/admin/products", view: "/products", keys: ["products"], section: "products" },
	{ label: "Home and contact", note: "Sectors, hero paragraph, figures, address and phone", href: "/admin/content", view: "/", keys: ["home", "contact"], section: "content" },
	{ label: "About", note: "Purpose, milestones and certifications", href: "/admin/about", view: "/about", keys: ["about"], section: "about" },
	{ label: "Careers", note: "Introduction and open roles", href: "/admin/careers", view: "/careers", keys: ["careers"], section: "careers" },
	{ label: "Blog", note: "Posts and articles", href: "/admin/blog", view: "/blog", keys: [], section: "blog" },
];

/* "5 min ago", "3 h ago", "2 d ago", then a date. */
function ago(iso: string) {
	const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
	if (s < 60) return "just now";
	if (s < 3600) return `${Math.floor(s / 60)} min ago`;
	if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
	if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
	return formatDate(iso);
}

const STATUS = {
	clean: { label: "Up to date", tone: "ok" },
	dirty: { label: "Has draft changes", tone: "warn" },
	unpublished: { label: "Not published", tone: "warn" },
} as const;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default async function AdminHome() {
	const profile = await requireStaff();
	const perms = profile.permissions as string[];
	const isFounder = profile.role === "founder";
	const can = (section: string) => isFounder || perms.includes(section);

	const [drafts, catalog, posts, activity] = await Promise.all([
		getDrafts(),
		getCatalog(),
		getAllPosts(),
		can("activity") ? getActivityLog(undefined, 8) : Promise.resolve([]),
	]);

	const statusByKey = new Map<string, PageStatus>(drafts.map((d) => [d.key, d.status]));
	const totals = catalogTotals(catalog);
	const popularCount = catalog.filter((c) => c.popular).length;
	const publishedPosts = posts.filter((p) => p.published).length;
	const pending = drafts.filter((d) => d.status !== "clean");
	const visibleSections = SECTIONS.filter((s) => can(s.section));

	return (
		<div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Overview" />

			{/* The state of the site, said once, in the site's own voice. */}
			<p className="max-w-3xl font-heading text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium leading-[1.2] tracking-[-0.03em] text-foreground">
				{plural(totals.products, "chemical")} in {plural(totals.categories, "industry", "industries")}
				{popularCount > 0 && <span className="text-muted">, {popularCount} marked Popular</span>}
				<span className="text-muted">
					. {plural(publishedPosts, "post")} published{posts.length - publishedPosts > 0 ? `, ${plural(posts.length - publishedPosts, "draft")}` : ""}.
				</span>
			</p>

			{pending.length > 0 && can("publish") && (
				<div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-lg bg-warn-soft px-5 py-4 text-warn-ink">
					<p className="max-w-2xl text-base font-medium">
						{pending.length === 1 ? "1 section has" : `${pending.length} sections have`} changes that aren&apos;t live yet:{" "}
						{pending.map((d) => d.label).join(", ")}.
					</p>
					<Link href="/admin/publish" className={BTN}>
						Review and publish
					</Link>
				</div>
			)}

			<div className="mt-20 grid grid-cols-1 gap-x-16 gap-y-16 lg:grid-cols-12">
				<Panel title="Sections" className={can("activity") ? "lg:col-span-7" : "lg:col-span-12"}>
					<ul className="-mx-4">
						{visibleSections.map((s) => {
							const statuses = s.keys.map((k) => statusByKey.get(k));
							const state: keyof typeof STATUS | null = !s.keys.length
								? null
								: statuses.some((st) => st === "unpublished")
									? "unpublished"
									: statuses.some((st) => st === "dirty")
										? "dirty"
										: "clean";
							return (
								<li key={s.label} className="group relative grid grid-cols-1 items-center sm:grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-lg px-4 py-5 transition-colors hover:bg-foreground/5">
									<div className="min-w-0">
										<Link href={s.href} className="font-heading text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-foreground outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-accent">
											{s.label}
										</Link>
										<p className="mt-1 text-base text-muted">{s.note}</p>
									</div>
									<div className="relative z-10 mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 sm:mt-0 sm:justify-end sm:text-right">
										{state ? <Status tone={STATUS[state].tone}>{STATUS[state].label}</Status> : <span className="text-sm text-muted">Published per post</span>}
										<a href={s.view} target="_blank" rel="noopener noreferrer" className={LINK_BTN} aria-label={`View ${s.label} on the site`}>
											View <ArrowUpRight size={14} aria-hidden />
										</a>
									</div>
								</li>
							);
						})}
					</ul>
				</Panel>

				{can("activity") && (
					<Panel
						title="Recent activity"
						className="lg:col-span-5"
						aside={
							<Link href="/admin/activity" className={LINK_BTN}>
								All activity
							</Link>
						}
					>
						{activity.length === 0 ? (
							<p className="text-base text-muted">Edits, publishes and team changes will show up here.</p>
						) : (
							<ul className="space-y-5">
								{activity.map((a) => (
									<li key={a.id}>
										<p className="text-base leading-snug text-foreground">
											{a.detail || `${ACTION_LABELS[a.action] ?? a.action}${a.target ? ` ${a.target}` : ""}`}
										</p>
										<p className="mt-0.5 text-sm text-muted">
											{a.actor_name || a.actor_email?.split("@")[0] || "Someone"}, {ago(a.created_at)}
										</p>
									</li>
								))}
							</ul>
						)}
					</Panel>
				)}
			</div>
		</div>
	);
}
