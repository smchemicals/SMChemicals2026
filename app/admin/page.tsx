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

const STATUS: Record<"clean" | "dirty" | "unpublished", { label: string; cls: string; dot: string }> = {
	clean: {
		label: "Up to date",
		cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
		dot: "bg-emerald-300",
	},
	dirty: {
		label: "Draft changes",
		cls: "border-amber-400/40 bg-amber-400/10 text-amber-300",
		dot: "bg-amber-300",
	},
	unpublished: {
		label: "Not published",
		cls: "border-amber-400/40 bg-amber-400/10 text-amber-300",
		dot: "bg-amber-300",
	},
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
			note: "categories badged on the homepage",
			href: "/admin/products",
		},
		{
			label: "Blog posts",
			value: posts.length,
			note: `${publishedPosts} published · ${posts.length - publishedPosts} drafts`,
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
		<div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
			<div className="mb-10">
				<p className="type-label mb-4 text-white/50">{today}</p>
				<h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight leading-none">
					Welcome back,{" "}
					<span className="text-white/50 font-light">{firstName}.</span>
				</h1>
				<p className="mt-4 max-w-xl text-white/65 text-base leading-relaxed">
					Edits are saved as drafts. When you’re ready, head to Publish to review
					what changed and push it live.
				</p>
			</div>

			{/* At a glance */}
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{stats.map((st) => (
					<Link
						key={st.label}
						href={st.href}
						className={`group rounded-lg border p-5 transition-colors ${
							st.warn
								? "border-amber-400/30 bg-amber-400/[0.06] hover:border-amber-400/50"
								: "border-white/10 bg-white/[0.03] hover:border-white/20"
						}`}
					>
						<span className={`type-label ${st.warn ? "text-amber-300" : "text-white/55"}`}>
							{st.label}
						</span>
						<span className="mt-3 block font-heading text-4xl font-light tabular-nums text-white">
							{st.value}
						</span>
						<span className="mt-1 block text-white/55 text-sm">{st.note}</span>
					</Link>
				))}
			</div>

			{/* Ready to publish */}
			{pending.length > 0 && can("publish") && (
				<div className="mt-6 flex flex-col gap-4 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-white font-medium">
							{pending.length === 1
								? "1 section has changes that aren’t live yet"
								: `${pending.length} sections have changes that aren’t live yet`}
						</p>
						<p className="mt-1 text-white/65 text-sm">
							{pending.map((d) => d.label).join(", ")}
						</p>
					</div>
					<Link
						href="/admin/publish"
						className="type-label inline-flex shrink-0 items-center gap-2 rounded-md bg-cta px-5 py-3 text-white transition-colors hover:bg-cta-hover"
					>
						Review &amp; publish <ArrowRight size={14} />
					</Link>
				</div>
			)}

			<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
				{/* Sections */}
				<section className={activity.length || can("activity") ? "lg:col-span-2" : "lg:col-span-3"}>
					<h2 className="type-label mb-4 text-white/55">Sections</h2>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{visibleSections.map((s) => {
							const statuses = s.keys.map((k) => statusByKey.get(k));
							const state: keyof typeof STATUS | null = !s.keys.length
								? null
								: statuses.some((st) => st === "unpublished")
									? "unpublished"
									: statuses.some((st) => st === "dirty")
										? "dirty"
										: "clean";
							const count =
								s.label === "Products"
									? totals.products
									: s.label === "Blog"
										? posts.length
										: undefined;
							const Icon = s.icon;

							return (
								<div
									key={s.label}
									className="group relative flex flex-col gap-5 rounded-lg border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-accent-500/40 hover:bg-white/[0.05]"
								>
									<div className="flex items-start gap-4">
										<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-accent-500">
											<Icon size={18} />
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex items-baseline justify-between gap-3">
												<Link
													href={s.href}
													className="font-heading text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-accent-500"
												>
													<span className="absolute inset-0" aria-hidden />
													{s.label}
												</Link>
												{count !== undefined && (
													<span className="text-white/55 text-sm tabular-nums">
														{count} items
													</span>
												)}
											</div>
											<p className="mt-0.5 text-white/60 text-sm">{s.note}</p>
										</div>
									</div>
									<div className="relative z-10 flex items-center justify-between gap-3">
										{state ? (
											<span
												className={`type-label inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 ${STATUS[state].cls}`}
											>
												<span className={`h-1.5 w-1.5 rounded-full ${STATUS[state].dot}`} />
												{STATUS[state].label}
											</span>
										) : (
											<span className="type-label text-white/45">Publishes per post</span>
										)}
										<a
											href={s.view}
											target="_blank"
											rel="noopener noreferrer"
											className="type-label inline-flex items-center gap-1 text-white/55 transition-colors hover:text-accent-500"
										>
											View <ArrowUpRight size={12} />
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
							<h2 className="type-label text-white/55">Recent activity</h2>
							<Link
								href="/admin/activity"
								className="type-label text-white/55 transition-colors hover:text-accent-500"
							>
								All →
							</Link>
						</div>
						<div className="rounded-lg border border-white/10 bg-white/[0.03]">
							{activity.length === 0 ? (
								<p className="p-5 text-white/55 text-sm">
									Edits, publishes and team changes will show up here.
								</p>
							) : (
								<ul className="divide-y divide-white/10">
									{activity.map((a) => (
										<li key={a.id} className="px-5 py-3.5">
											<p className="text-white/85 text-sm leading-snug">
												{a.detail ||
													`${ACTION_LABELS[a.action] ?? a.action}${a.target ? ` ${a.target}` : ""}`}
											</p>
											<p className="mt-1 text-white/45 text-xs">
												{a.actor_name || a.actor_email?.split("@")[0] || "Someone"} ·{" "}
												{ago(a.created_at)}
											</p>
										</li>
									))}
								</ul>
							)}
						</div>
						{popularCount === 0 && can("products") && (
							<Link
								href="/admin/products"
								className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-white/65 text-sm transition-colors hover:border-amber-400/40"
							>
								<Star size={14} className="text-amber-300" />
								No categories are marked Popular yet.
							</Link>
						)}
					</section>
				)}
			</div>
		</div>
	);
}
