import Link from "next/link";
import {
	FlaskConical,
	FileText,
	Info,
	Briefcase,
	Newspaper,
	Star,
	ArrowRight,
	ArrowUpRight,
	type LucideIcon,
} from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDrafts, type SnapshotKey, type PageStatus } from "@/lib/cms/snapshots";
import { getCatalog, catalogTotals } from "@/lib/cms/products";
import { getAllPosts } from "@/lib/cms/blog";
import { getActivityLog, ACTION_LABELS } from "@/lib/cms/activity";
import { BTN, LINK_BTN, PageHeader, Status } from "@/components/admin/ui";

export const metadata = { title: "Overview" };

const SECTIONS: {
	label: string;
	note: string;
	href: string;
	view: string;
	keys: SnapshotKey[];
	section: string;
	icon: LucideIcon;
}[] = [
	{
		label: "Products",
		icon: FlaskConical,
		note: "Categories & products",
		href: "/admin/products",
		view: "/products",
		keys: ["products"],
		section: "products",
	},
	{
		label: "Home & Contact",
		icon: FileText,
		note: "Home figures & contact details",
		href: "/admin/content",
		view: "/",
		keys: ["home", "contact"],
		section: "content",
	},
	{
		label: "About",
		icon: Info,
		note: "Purpose, milestones & certifications",
		href: "/admin/about",
		view: "/about",
		keys: ["about"],
		section: "about",
	},
	{
		label: "Careers",
		icon: Briefcase,
		note: "Intro, values & open roles",
		href: "/admin/careers",
		view: "/careers",
		keys: ["careers"],
		section: "careers",
	},
	{
		label: "Blog",
		icon: Newspaper,
		note: "Posts & articles",
		href: "/admin/blog",
		view: "/blog",
		keys: [],
		section: "blog",
	},
];

/* "5 min ago", "3 h ago", "2 d ago", then a date. */
function ago(iso: string) {
	const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
	if (s < 60) return "just now";
	if (s < 3600) return `${Math.floor(s / 60)} min ago`;
	if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
	if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
	return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATUS: Record<"clean" | "dirty" | "unpublished", { label: string; tone: "ok" | "warn" }> = {
	clean: { label: "Up to date", tone: "ok" },
	dirty: { label: "Draft changes", tone: "warn" },
	unpublished: { label: "Not published", tone: "warn" },
};

export default async function AdminHome() {
	const profile = await requireStaff();
	const perms = profile.permissions as string[];
	const isFounder = profile.role === "founder";
	const can = (section: string) => isFounder || perms.includes(section);

	const [drafts, catalog, posts, activity] = await Promise.all([
		getDrafts(),
		getCatalog(),
		getAllPosts(),
		can("activity") ? getActivityLog(undefined, 6) : Promise.resolve([]),
	]);

	const statusByKey = new Map<string, PageStatus>(
		drafts.map((d) => [d.key, d.status]),
	);
	const totals = catalogTotals(catalog);
	const popularCount = catalog.filter((c) => c.popular).length;
	const publishedPosts = posts.filter((p) => p.published).length;
	const pending = drafts.filter((d) => d.status !== "clean");
	const firstName = (profile.full_name?.trim() || profile.email.split("@")[0])
		.split(" ")[0];
	const visibleSections = SECTIONS.filter((s) => can(s.section));
	const today = new Date().toLocaleDateString("en-IN", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	const stats = [
		{
			label: "Products",
			value: totals.products,
			note: `across ${totals.categories} categories`,
			href: "/admin/products",
		},
		{
			label: "Popular",
			value: popularCount,
			note: "categories badged Popular on the site",
			href: "/admin/products",
		},
		{
			label: "Blog posts",
			value: posts.length,
			note: `${publishedPosts} published, ${posts.length - publishedPosts} drafts`,
			href: "/admin/blog",
		},
		{
			label: "Unpublished",
			value: pending.length,
			note: pending.length ? "sections waiting to go live" : "everything is live",
			href: "/admin/publish",
			warn: pending.length > 0,
		},
	];

	return (
		<div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title={`Welcome back, ${firstName}`}>
				{today}. Edits are saved as drafts. When you are ready, open Publish to review what changed and push it live.
			</PageHeader>

			{/* At a glance */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{stats.map((st) => (
					<Link
						key={st.label}
						href={st.href}
						className={`rounded-xl p-5 outline-none ring-2 ring-transparent transition-shadow hover:ring-foreground/15 focus-visible:ring-accent ${
							st.warn ? "bg-warn-soft text-warn-ink" : "bg-surface text-foreground"
						}`}
					>
						<span className={`text-sm font-medium ${st.warn ? "" : "text-muted"}`}>{st.label}</span>
						<span className="mt-3 block font-heading text-4xl font-semibold tracking-[-0.04em] tabular-nums">{st.value}</span>
						<span className={`mt-1 block text-sm ${st.warn ? "" : "text-muted"}`}>{st.note}</span>
					</Link>
				))}
			</div>

			{/* Ready to publish */}
			{pending.length > 0 && can("publish") && (
				<div className="mt-4 flex flex-col gap-4 rounded-xl bg-warn-soft p-5 text-warn-ink sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="font-heading text-lg font-semibold tracking-[-0.02em]">
							{pending.length === 1 ? "1 section has changes that aren't live yet" : `${pending.length} sections have changes that aren't live yet`}
						</p>
						<p className="mt-1 text-sm">{pending.map((d) => d.label).join(", ")}</p>
					</div>
					<Link href="/admin/publish" className={BTN}>
						Review and publish <ArrowRight size={16} aria-hidden />
					</Link>
				</div>
			)}

			<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
				{/* Sections */}
				<section className={can("activity") ? "lg:col-span-2" : "lg:col-span-3"}>
					<h2 className="mb-4 font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">Sections</h2>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{visibleSections.map((s) => {
							const statuses = s.keys.map((k) => statusByKey.get(k));
							const state: keyof typeof STATUS | null = !s.keys.length
								? null
								: statuses.some((st) => st === "unpublished")
									? "unpublished"
									: statuses.some((st) => st === "dirty")
										? "dirty"
										: "clean";
							const count = s.label === "Products" ? totals.products : s.label === "Blog" ? posts.length : undefined;
							const Icon = s.icon;

							return (
								<div key={s.label} className="relative flex flex-col gap-5 rounded-xl bg-surface p-5 ring-2 ring-transparent transition-shadow focus-within:ring-accent hover:ring-foreground/15">
									<div className="flex items-start gap-4">
										<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-accent-ink">
											<Icon size={18} aria-hidden />
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex items-baseline justify-between gap-3">
												<Link href={s.href} className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground outline-none">
													<span className="absolute inset-0" aria-hidden />
													{s.label}
												</Link>
												{count !== undefined && <span className="text-sm tabular-nums text-muted">{count} items</span>}
											</div>
											<p className="mt-0.5 text-sm text-muted">{s.note}</p>
										</div>
									</div>
									<div className="relative z-10 flex items-center justify-between gap-3">
										{state ? <Status tone={STATUS[state].tone}>{STATUS[state].label}</Status> : <span className="text-sm text-muted">Publishes per post</span>}
										<a href={s.view} target="_blank" rel="noopener noreferrer" className={LINK_BTN}>
											View <ArrowUpRight size={14} aria-hidden />
										</a>
									</div>
								</div>
							);
						})}
					</div>
				</section>

				{/* Recent activity */}
				{can("activity") && (
					<section>
						<div className="mb-4 flex items-baseline justify-between">
							<h2 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">Recent activity</h2>
							<Link href="/admin/activity" className={LINK_BTN}>
								All <ArrowRight size={14} aria-hidden />
							</Link>
						</div>
						<div className="rounded-xl bg-surface">
							{activity.length === 0 ? (
								<p className="p-5 text-base text-muted">Edits, publishes and team changes will show up here.</p>
							) : (
								<ul className="divide-y divide-line">
									{activity.map((a) => (
										<li key={a.id} className="px-5 py-4">
											<p className="text-base leading-snug text-foreground">
												{a.detail || `${ACTION_LABELS[a.action] ?? a.action}${a.target ? ` ${a.target}` : ""}`}
											</p>
											<p className="mt-1 text-sm text-muted">
												{a.actor_name || a.actor_email?.split("@")[0] || "Someone"}, {ago(a.created_at)}
											</p>
										</li>
									))}
								</ul>
							)}
						</div>
						{popularCount === 0 && can("products") && (
							<Link href="/admin/products" className="mt-4 flex items-center gap-3 rounded-xl bg-warn-soft p-4 text-sm font-medium text-warn-ink">
								<Star size={16} aria-hidden />
								No categories are marked Popular yet.
							</Link>
						)}
					</section>
				)}
			</div>
		</div>
	);
}
