"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { saveCareers, type CareersState } from "./actions";
import type { CareersContent, CareersIntro, CareersValue, JobOpening } from "@/data/careers";
import { BTN, BTN_QUIET, FIELD_IN_PANEL as FIELD, Field, ICON_BTN, Panel, SaveResult } from "@/components/admin/ui";

const INNER = FIELD.replace("bg-background", "bg-surface");

const emptyValue: CareersValue = { title: "", detail: "" };
const emptyOpening: JobOpening = { id: "", title: "", department: "", type: "Full-time", location: "", description: "" };

export function CareersForm({ careers }: { careers: CareersContent }) {
	const router = useRouter();
	const [state, action, pending] = useActionState(saveCareers, {} as CareersState);
	const [intro, setIntro] = useState<CareersIntro>(careers.intro);
	const [openings, setOpenings] = useState<JobOpening[]>(careers.openings);

	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	const setValue = (i: number, k: keyof CareersValue, v: string) =>
		setIntro((p) => ({ ...p, values: p.values.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
	const setOpening = (i: number, k: keyof JobOpening, v: string) =>
		setOpenings((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

	return (
		<form action={action} className="space-y-8">
			<input type="hidden" name="payload" value={JSON.stringify({ intro, openings })} />

			<Panel title="Introduction">
				<Field label="Opening paragraph" hint="The large text at the top of the careers page.">
					<textarea value={intro.body} onChange={(e) => setIntro((p) => ({ ...p, body: e.target.value }))} rows={4} className={`${FIELD} resize-none`} />
				</Field>

				<h3 className="mb-3 mt-8 font-heading text-base font-semibold tracking-[-0.01em] text-foreground">What it is like to work here</h3>
				<ul className="space-y-4">
					{intro.values.map((v, i) => (
						<li key={i} className="flex items-start gap-3 rounded-lg bg-background p-4">
							<div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
								<Field label="Title">
									<input value={v.title} onChange={(e) => setValue(i, "title", e.target.value)} className={INNER} />
								</Field>
								<Field label="Detail" className="sm:col-span-2">
									<input value={v.detail} onChange={(e) => setValue(i, "detail", e.target.value)} className={INNER} />
								</Field>
							</div>
							<div className="mt-7">
								<button
									type="button"
									onClick={() => setIntro((p) => ({ ...p, values: p.values.filter((_, j) => j !== i) }))}
									aria-label={`Remove ${v.title || "point"}`}
									title="Remove"
									className={`${ICON_BTN} hover:text-danger-ink`}
								>
									<Trash2 size={18} aria-hidden />
								</button>
							</div>
						</li>
					))}
				</ul>
				<button type="button" onClick={() => setIntro((p) => ({ ...p, values: [...p.values, { ...emptyValue }] }))} className={`${BTN_QUIET} mt-4`}>
					<Plus size={16} aria-hidden /> Add point
				</button>
			</Panel>

			<Panel title="Open positions">
				<ul className="space-y-4">
					{openings.map((o, i) => (
						<li key={i} className="relative rounded-lg bg-background p-4 md:p-5">
							<div className="absolute right-3 top-3">
								<button
									type="button"
									onClick={() => setOpenings((p) => p.filter((_, j) => j !== i))}
									aria-label={`Remove ${o.title || "role"}`}
									title="Remove"
									className={`${ICON_BTN} hover:text-danger-ink`}
								>
									<Trash2 size={18} aria-hidden />
								</button>
							</div>
							<div className="grid grid-cols-1 gap-4 pr-12 sm:grid-cols-2">
								<Field label="Role">
									<input value={o.title} onChange={(e) => setOpening(i, "title", e.target.value)} className={INNER} />
								</Field>
								<Field label="Department">
									<input value={o.department} onChange={(e) => setOpening(i, "department", e.target.value)} className={INNER} />
								</Field>
								<Field label="Type">
									<input value={o.type} onChange={(e) => setOpening(i, "type", e.target.value)} className={INNER} />
								</Field>
								<Field label="Location">
									<input value={o.location} onChange={(e) => setOpening(i, "location", e.target.value)} className={INNER} />
								</Field>
							</div>
							<Field label="Description" className="mt-4">
								<textarea value={o.description} onChange={(e) => setOpening(i, "description", e.target.value)} rows={3} className={`${INNER} resize-none`} />
							</Field>
						</li>
					))}
				</ul>

				{openings.length === 0 && <p className="text-base text-muted">No open roles. The careers page will invite a general application.</p>}

				<button type="button" onClick={() => setOpenings((p) => [...p, { ...emptyOpening }])} className={`${BTN_QUIET} mt-4`}>
					<Plus size={16} aria-hidden /> Add role
				</button>
			</Panel>

			<div className="flex flex-wrap items-center gap-4">
				<button type="submit" disabled={pending} className={BTN}>
					{pending ? "Saving…" : "Save careers"}
				</button>
				<SaveResult {...state} />
			</div>
		</form>
	);
}
