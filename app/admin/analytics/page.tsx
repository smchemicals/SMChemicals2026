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
				<div className="max-w-2xl space-y-3 text-lg text-muted">
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
			) : (
				<>
					<nav aria-label="Range" className="mb-14 flex flex-wrap gap-x-7 gap-y-2">
						{RANGES.map((r) => (
							<Link
								key={r}
								href={r === 30 ? "/admin/analytics" : `/admin/analytics?range=${r}`}
								aria-current={days === r ? "page" : undefined}
								className={`rounded py-1 font-heading text-lg tracking-[-0.02em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
									days === r ? "font-semibold text-foreground underline decoration-2 underline-offset-8" : "font-medium text-muted hover:text-foreground"
								}`}
							>
								Last {r} days
							</Link>
						))}
					</nav>

					<dl className="grid gap-x-12 gap-y-10 sm:grid-cols-3">
						{[
							["Views", stats.total.toLocaleString("en-IN")],
							["Today", stats.today.toLocaleString("en-IN")],
							["Daily average", stats.average.toLocaleString("en-IN")],
						].map(([k, v]) => (
							<div key={k}>
								<dd className="font-heading text-[clamp(3rem,6vw,5rem)] font-semibold leading-none tracking-[-0.05em] tabular-nums text-foreground">{v}</dd>
								<dt className="mt-3 text-lg text-muted">{k}</dt>
							</div>
						))}
					</dl>

					<Panel title="Per day" className="mt-20">
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

					<Panel title="Most viewed pages" className="mt-20">
						{stats.pages.length === 0 ? (
							<p className="text-base text-muted">No views yet. They appear here once the live site has visitors.</p>
						) : (
							<ul className="-mx-4">
								{stats.pages.map((p) => (
									<li key={p.path} className="flex items-baseline justify-between gap-6 rounded-lg px-4 py-3 transition-colors hover:bg-foreground/5">
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
