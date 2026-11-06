import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import {
	getActivityLog,
	ACTION_LABELS,
	ACTIVITY_FILTERS,
} from "@/lib/cms/activity";
import { supabaseConfigured } from "@/lib/cms/products";
import Link from "next/link";
import { formatDateTime } from "@/lib/format-date";
import { Notice, PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Activity" };

const FILTER_LABELS: Record<string, string> = {
	all: "All",
	edits: "Edits",
	publishes: "Publishing",
	team: "Team",
};

export default async function ActivityAdmin({
	searchParams,
}: {
	searchParams: Promise<{ filter?: string }>;
}) {
	await requirePermission("activity");
	const { filter } = await searchParams;
	const active = filter && ACTIVITY_FILTERS[filter] ? filter : "all";
	const entries = await getActivityLog(active === "all" ? undefined : active);

	return (
		<div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Activity">Every edit, publish and team change, most recent first.</PageHeader>
			{DEV_BYPASS && <Notice tone="warn" className="mb-8">Dev mode: no activity is recorded until Supabase is connected.</Notice>}

			<nav aria-label="Filter" className="mb-12 flex flex-wrap gap-x-7 gap-y-2">
				{Object.entries(FILTER_LABELS).map(([key, label]) => {
					const isActive = active === key;
					return (
						<Link
							key={key}
							href={key === "all" ? "/admin/activity" : `/admin/activity?filter=${key}`}
							aria-current={isActive ? "page" : undefined}
							className={`rounded py-1 font-heading text-lg tracking-[-0.02em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
								isActive ? "font-semibold text-foreground underline decoration-2 underline-offset-8" : "font-medium text-muted hover:text-foreground"
							}`}
						>
							{label}
						</Link>
					);
				})}
			</nav>

			{entries.length === 0 ? (
				<p className="text-lg text-muted">
					{supabaseConfigured() ? "No activity recorded yet." : "Activity appears here once Supabase is connected."}
				</p>
			) : (
				<section>
					<ul className="-mx-4">
						{entries.map((e) => (
							<li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-lg px-4 py-4 transition-colors hover:bg-foreground/5">
								<div className="min-w-0">
									<span className="text-base font-medium text-foreground">{ACTION_LABELS[e.action] ?? e.action}</span>
									{e.target && <span className="text-base text-muted">, {e.target}</span>}
									{e.detail && <span className="block text-sm text-muted">{e.detail}</span>}
								</div>
								<div className="text-right text-sm text-muted">
									<span>{e.actor_name || e.actor_email || "Unknown"}</span>
									<span className="block">{formatDateTime(e.created_at)}</span>
								</div>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}
