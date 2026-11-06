import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getViewStats } from "@/lib/cms/analytics";

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
		<div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
			<div className="mb-10">
				<div className="mb-5 flex items-center gap-3">
					<span className="h-px w-7 bg-accent-500" />
					<span className="type-label text-accent-500">Analytics</span>
				</div>
				<h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight leading-none">
					Page views<span className="text-white/50 font-light">.</span>
				</h1>
				<p className="mt-6 text-white/65 text-sm font-light tracking-wide">
					How many times each page was opened. Only counts are kept: nothing about who looked.
				</p>
			</div>

			{!stats.available ? (
				<div className="border border-white/10 bg-white/2 px-6 py-10 text-white/70 text-sm font-light leading-relaxed">
					{stats.reason === "not-configured" ? (
						<p>Views are counted once Supabase is connected.</p>
					) : (
						<>
							<p className="text-white font-medium">Counting isn&rsquo;t switched on yet.</p>
							<p className="mt-3">
								Run <code className="text-accent-500">supabase/migrations/0010_page_views.sql</code> in the Supabase SQL editor. The website keeps
								working either way; views are simply counted from the moment it has run.
							</p>
						</>
					)}
					<p className="mt-4 text-white/50">
						The visit counts from Vercel Analytics are in your Vercel project, under Analytics. They are separate from this page.
					</p>
				</div>
			) : (
				<>
					<div className="mb-8 flex flex-wrap gap-2">
						{RANGES.map((r) => (
							<Link
								key={r}
								href={r === 30 ? "/admin/analytics" : `/admin/analytics?range=${r}`}
								className={`type-label border px-4 py-2 transition-colors ${
									days === r ? "border-accent-500/40 bg-accent-500/10 text-accent-500" : "border-white/15 text-white/65 hover:text-white"
								}`}
							>
								Last {r} days
							</Link>
						))}
					</div>

					<dl className="grid gap-px bg-white/10 sm:grid-cols-3">
						{[
							["Views", stats.total.toLocaleString("en-IN")],
							["Today", stats.today.toLocaleString("en-IN")],
							["Daily average", stats.average.toLocaleString("en-IN")],
						].map(([k, v]) => (
							<div key={k} className="bg-[#0b1d28] px-6 py-6">
								<dt className="type-label text-white/55">{k}</dt>
								<dd className="mt-3 text-white text-4xl font-semibold tracking-tight">{v}</dd>
							</div>
						))}
					</dl>

					<section className="mt-12" aria-label="Views per day">
						<h2 className="type-label text-white/55">Per day</h2>
						<div className="mt-5 flex h-44 items-end gap-[3px]" role="img" aria-label={`Views per day over the last ${days} days`}>
							{(() => {
								const max = Math.max(1, ...stats.perDay.map((d) => d.views));
								return stats.perDay.map((d) => (
									<div key={d.day} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${short(d.day)}: ${d.views}`}>
										<div className="w-full bg-accent-500/70 transition-colors group-hover:bg-accent-500" style={{ height: `${Math.max(d.views ? 3 : 0, (d.views / max) * 100)}%` }} />
									</div>
								));
							})()}
						</div>
						<div className="mt-2 flex justify-between text-white/45 text-xs font-light">
							<span>{short(stats.perDay[0].day)}</span>
							<span>{short(stats.perDay[stats.perDay.length - 1].day)}</span>
						</div>
					</section>

					<section className="mt-12" aria-label="Most viewed pages">
						<h2 className="type-label text-white/55">Most viewed pages</h2>
						{stats.pages.length === 0 ? (
							<p className="mt-5 border border-white/10 bg-white/2 px-6 py-10 text-center text-white/55 text-sm font-light">
								No views yet. They appear here once the live site has visitors.
							</p>
						) : (
							<div className="mt-5 border-t border-white/10">
								{stats.pages.map((p) => (
									<div key={p.path} className="flex items-baseline justify-between gap-6 border-b border-white/10 py-3">
										<span className="min-w-0 truncate text-white text-sm">{label(p.path)}</span>
										<span className="shrink-0 text-white/70 text-sm tabular-nums">
											{p.views.toLocaleString("en-IN")}
											<span className="ml-3 text-white/45 text-xs">{stats.total ? Math.round((p.views / stats.total) * 100) : 0}%</span>
										</span>
									</div>
								))}
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
}
