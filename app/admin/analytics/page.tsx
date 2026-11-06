import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getViewStats } from "@/lib/cms/analytics";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Analytics" };

const RANGES = [7, 30, 90];

const label = (path: string) => (path === "/" ? "Home" : path);
const short = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function AnalyticsAdmin({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
	await requirePermission("activity");
	const { range } = await searchParams;
	const days = RANGES.includes(Number(range)) ? Number(range) : 30;
	const stats = await getViewStats(days);

	return (
		<div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Page views">
				How many times each page was opened. Only counts are kept: nothing about who looked.
			</PageHeader>

			{!stats.available ? (
				<Panel>
					<div className="space-y-3 text-base text-muted">
						{stats.reason === "not-configured" ? (
							<p>Views are counted once Supabase is connected.</p>
						) : (
							<>
								<p className="font-heading text-lg font-semibold text-foreground">Counting isn&rsquo;t switched on yet.</p>
								<p>
									The <code className="rounded bg-background px-1.5 py-0.5 text-sm text-foreground">page_views</code> table is missing. In the Supabase SQL editor run <code className="rounded bg-background px-1.5 py-0.5 text-sm text-foreground">supabase/existing-project-update.sql</code> (or <code className="rounded bg-background px-1.5 py-0.5 text-sm text-foreground">0002_content.sql</code> on a new project).
									The website keeps working either way; views are counted from the moment it has run.
								</p>
							</>
						)}
						<p>The visit counts from Vercel Analytics are in your Vercel project, under Analytics. They are separate from this page.</p>
					</div>
				</Panel>
			) : (
				<>
					<nav aria-label="Range" className="mb-8 flex flex-wrap gap-2">
						{RANGES.map((r) => (
							<Link
								key={r}
								href={r === 30 ? "/admin/analytics" : `/admin/analytics?range=${r}`}
								aria-current={days === r ? "page" : undefined}
								className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
									days === r ? "bg-foreground text-background" : "bg-surface text-muted hover:text-foreground"
								}`}
							>
								Last {r} days
							</Link>
						))}
					</nav>

					<dl className="grid gap-4 sm:grid-cols-3">
						{[
							["Views", stats.total.toLocaleString("en-IN")],
							["Today", stats.today.toLocaleString("en-IN")],
							["Daily average", stats.average.toLocaleString("en-IN")],
						].map(([k, v]) => (
							<div key={k} className="rounded-xl bg-surface px-6 py-6">
								<dt className="text-sm font-medium text-muted">{k}</dt>
								<dd className="mt-3 font-heading text-4xl font-semibold tracking-[-0.04em] tabular-nums text-foreground">{v}</dd>
							</div>
						))}
					</dl>

					<Panel title="Per day" className="mt-8">
						<div className="flex h-44 items-end gap-[3px]" role="img" aria-label={`Views per day over the last ${days} days`}>
							{(() => {
								const max = Math.max(1, ...stats.perDay.map((d) => d.views));
								return stats.perDay.map((d) => (
									<div key={d.day} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${short(d.day)}: ${d.views}`}>
										<div className="w-full rounded-t-sm bg-accent/60 transition-colors group-hover:bg-accent" style={{ height: `${Math.max(d.views ? 3 : 0, (d.views / max) * 100)}%` }} />
									</div>
								));
							})()}
						</div>
						<div className="mt-3 flex justify-between text-sm text-muted">
							<span>{short(stats.perDay[0].day)}</span>
							<span>{short(stats.perDay[stats.perDay.length - 1].day)}</span>
						</div>
					</Panel>

					<Panel title="Most viewed pages" className="mt-8">
						{stats.pages.length === 0 ? (
							<p className="text-base text-muted">No views yet. They appear here once the live site has visitors.</p>
						) : (
							<ul className="divide-y divide-line">
								{stats.pages.map((p) => (
									<li key={p.path} className="flex items-baseline justify-between gap-6 py-3">
										<span className="min-w-0 truncate text-base text-foreground">{label(p.path)}</span>
										<span className="shrink-0 text-base tabular-nums text-foreground">
											{p.views.toLocaleString("en-IN")}
											<span className="ml-3 text-sm text-muted">{stats.total ? Math.round((p.views / stats.total) * 100) : 0}%</span>
										</span>
									</li>
								))}
							</ul>
						)}
					</Panel>
				</>
			)}
		</div>
	);
}
