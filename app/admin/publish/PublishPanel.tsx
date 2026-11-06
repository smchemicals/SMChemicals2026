"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { publishPage, publishAll, discardPage } from "./actions";
import type { PageDraft, PageStatus } from "@/lib/cms/snapshots";
import { formatDateTime } from "@/lib/format-date";
import { BTN, BTN_QUIET, LINK_BTN, Panel, Status } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/confirm-action";

function StatusChip({ status, count }: { status: PageStatus; count: number }) {
	if (status === "dirty") return <Status tone="warn">{count} unpublished change{count === 1 ? "" : "s"}</Status>;
	if (status === "unpublished") return <Status tone="warn">Not published</Status>;
	return <Status tone="ok">Up to date</Status>;
}

function Item({ row }: { row: PageDraft }) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState("");
	const [open, setOpen] = useState(false);

	const when = row.publishedAt ? `Published ${formatDateTime(row.publishedAt)}` : "Not published yet, nothing live";

	return (
		<li className="rounded-lg px-4 py-5 transition-colors hover:bg-foreground/5">
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-3">
						<span className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">{row.label}</span>
						<StatusChip status={row.status} count={row.changes.length} />
					</div>
					<div className="mt-1 text-sm text-muted" role="status">{msg || when}</div>
				</div>
				<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
					{row.status === "dirty" && (
						<>
							<button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={LINK_BTN}>
								{open ? "Hide changes" : "Review changes"}
							</button>
							<ConfirmAction
								disabled={pending}
								prompt={`Discard your changes to ${row.label}?`}
								warning="The live version comes back and your unpublished edits are lost."
								confirmLabel="Yes, discard"
								onConfirm={() =>
									start(async () => {
										setMsg("");
										const res = await discardPage(row.key);
										setMsg(res.error ? res.error : "Draft discarded");
										setOpen(false);
										router.refresh();
									})
								}
							>
								Discard changes
							</ConfirmAction>
						</>
					)}
					{row.status !== "clean" && (
						<a href={`/preview?path=${encodeURIComponent(row.path)}`} target="_blank" rel="noopener noreferrer" className={LINK_BTN}>
							Preview draft <ArrowUpRight size={14} aria-hidden />
						</a>
					)}
					<a href={row.path} target="_blank" rel="noopener noreferrer" className={LINK_BTN}>
						View live <ArrowUpRight size={14} aria-hidden />
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
						className={`${BTN} disabled:cursor-not-allowed disabled:opacity-40`}
					>
						{pending ? "Publishing…" : "Publish"}
					</button>
				</div>
			</div>
			{open && row.changes.length > 0 && (
				<ul className="mt-4 space-y-1.5 rounded-lg bg-surface px-4 py-3">
					{row.changes.map((c, i) => (
						<li key={i} className="text-sm leading-relaxed text-muted">
							{c}
						</li>
					))}
				</ul>
			)}
		</li>
	);
}

export function PublishPanel({ pages }: { pages: PageDraft[] }) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState("");
	const dirty = pages.filter((p) => p.status !== "clean").length;

	return (
		<Panel>
			<ul className="-mx-4">
				{pages.map((row) => (
					<Item key={row.key} row={row} />
				))}
			</ul>
			<div className="mt-10 flex flex-wrap items-center gap-4">
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
					className={`${BTN_QUIET} disabled:cursor-not-allowed disabled:opacity-40`}
				>
					{pending ? "Publishing all…" : "Publish all"}
				</button>
				{msg && <span role="status" className="text-sm text-muted">{msg}</span>}
			</div>
		</Panel>
	);
}
