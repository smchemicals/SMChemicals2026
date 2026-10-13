import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import {
	getActivityLog,
	ACTION_LABELS,
	ACTIVITY_FILTERS,
} from "@/lib/cms/activity";
import { supabaseConfigured } from "@/lib/cms/products";
import Link from "next/link";

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
		<div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
			<div className="mb-10">
				<div className="mb-5 flex items-center gap-3">
					<span className="h-px w-7 bg-accent-500" />
					<span className="type-label text-accent-500">
						Activity
					</span>
				</div>
				<h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight leading-none">
					Audit trail<span className="text-white/50 font-light">.</span>
				</h1>
				<p className="mt-6 text-white/65 text-sm font-light tracking-wide">
					Every edit, publish and team change, most recent first.
				</p>
				{DEV_BYPASS && (
					<p className="mt-4 inline-block border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-amber-300 text-xs font-medium tracking-wide">
						Dev mode — no activity is recorded until Supabase is connected.
					</p>
				)}
			</div>

			<div className="mb-8 flex flex-wrap gap-2">
				{Object.entries(FILTER_LABELS).map(([key, label]) => {
					const isActive = active === key;
					return (
						<Link
							key={key}
							href={key === "all" ? "/admin/activity" : `/admin/activity?filter=${key}`}
							className={`type-label border px-4 py-2 transition-colors ${
								isActive
									? "border-accent-500/40 bg-accent-500/10 text-accent-500"
									: "border-white/15 text-white/65 hover:text-white"
							}`}
						>
							{label}
						</Link>
					);
				})}
			</div>

			{entries.length === 0 ? (
				<p className="border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-white/55 text-sm font-light">
					{supabaseConfigured()
						? "No activity recorded yet."
						: "Activity appears here once Supabase is connected."}
				</p>
			) : (
				<div className="border-t border-white/10">
					{entries.map((e) => (
						<div
							key={e.id}
							className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/10 py-4"
						>
							<div className="min-w-0">
								<span className="text-white text-sm font-medium">
									{ACTION_LABELS[e.action] ?? e.action}
								</span>
								{e.target && (
									<span className="text-white/70 text-sm font-light"> · {e.target}</span>
								)}
								{e.detail && (
									<span className="block text-white/55 text-xs font-light tracking-wide">
										{e.detail}
									</span>
								)}
							</div>
							<div className="text-right text-white/55 text-xs font-light tracking-wide">
								<span>{e.actor_name || e.actor_email || "—"}</span>
								<span className="block">
									{new Date(e.created_at).toLocaleString()}
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
