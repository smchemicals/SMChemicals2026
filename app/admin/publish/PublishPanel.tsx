"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishPage, publishAll, discardPage } from "./actions";
import type { PageDraft, PageStatus } from "@/lib/cms/snapshots";

function StatusChip({ status, count }: { status: PageStatus; count: number }) {
	if (status === "dirty")
		return (
			<span className="type-label border border-accent-500/40 bg-accent-500/10 px-2.5 py-0.5 text-accent-500">
				{count} unpublished change{count === 1 ? "" : "s"}
			</span>
		);
	if (status === "unpublished")
		return (
			<span className="type-label border border-white/20 px-2.5 py-0.5 text-white/70">
				Not published
			</span>
		);
	return (
		<span className="type-label border border-white/10 px-2.5 py-0.5 text-white/50">
			Up to date
		</span>
	);
}

function Item({ row }: { row: PageDraft }) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState("");
	const [open, setOpen] = useState(false);

	const when = row.publishedAt
		? `Published ${new Date(row.publishedAt).toLocaleString()}`
		: "Not published yet — nothing live";

	return (
		<div className="border-b border-white/10 py-5 last:border-b-0">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="min-w-0">
					<div className="flex items-center gap-3">
						<span className="text-white text-lg font-bold tracking-tight">
							{row.label}
						</span>
						<StatusChip status={row.status} count={row.changes.length} />
					</div>
					<div className="mt-1 text-white/65 text-xs font-light tracking-wide">
						{msg || when}
					</div>
				</div>
				<div className="flex items-center gap-5">
					{row.status === "dirty" && (
						<>
							<button
								type="button"
								onClick={() => setOpen((v) => !v)}
								className="type-label text-accent-500 transition-opacity hover:opacity-70 cursor-pointer"
							>
								{open ? "Hide" : "Review"}
							</button>
							<button
								type="button"
								disabled={pending}
								onClick={() => {
									if (
										!window.confirm(
											`Discard all unpublished changes to ${row.label}? This restores the live published version and cannot be undone.`,
										)
									)
										return;
									start(async () => {
										setMsg("");
										const res = await discardPage(row.key);
										setMsg(res.error ? res.error : "Draft discarded");
										setOpen(false);
										router.refresh();
									});
								}}
								className="type-label text-white/70 transition-colors hover:text-white disabled:opacity-50 cursor-pointer"
							>
								Discard
							</button>
						</>
					)}
					{row.status !== "clean" && (
						<a
							href={`/preview?path=${encodeURIComponent(row.path)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="type-label text-accent-500 transition-opacity hover:opacity-70"
						>
							Preview draft ↗
						</a>
					)}
					<a
						href={row.path}
						target="_blank"
						rel="noopener noreferrer"
						className="type-label text-white/70 transition-colors hover:text-white"
					>
						View live ↗
					</a>
					<button
						type="button"
						disabled={pending || row.status === "clean"}
						onClick={() =>
							start(async () => {
								setMsg("");
								const res = await publishPage(row.key);
								setMsg(res.error ? res.error : "Published");
								setOpen(false);
								router.refresh();
							})
						}
						className="type-label bg-cta px-6 py-2.5 text-white transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
					>
						{pending ? "Publishing…" : "Publish"}
					</button>
				</div>
			</div>
			{open && row.changes.length > 0 && (
				<ul className="mt-4 space-y-1 border border-white/10 bg-white/[0.02] px-4 py-3">
					{row.changes.map((c, i) => (
						<li
							key={i}
							className="text-white/70 text-[0.8rem] font-light leading-relaxed"
						>
							{c}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export function PublishPanel({ pages }: { pages: PageDraft[] }) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState("");
	const dirty = pages.filter((p) => p.status !== "clean").length;

	return (
		<div className="flex flex-col">
			{pages.map((row) => (
				<Item key={row.key} row={row} />
			))}
			<div className="mt-7 flex items-center gap-4">
				<button
					type="button"
					disabled={pending || dirty === 0}
					onClick={() =>
						start(async () => {
							setMsg("");
							const res = await publishAll();
							setMsg(res.error ? res.error : "All sections published");
							router.refresh();
						})
					}
					className="type-label border border-accent-500/40 px-6 py-2.5 text-accent-500 transition-colors hover:bg-accent-500/10 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
				>
					{pending ? "Publishing all…" : "Publish all"}
				</button>
				{msg && <span className="text-white/70 text-sm font-light">{msg}</span>}
			</div>
		</div>
	);
}
