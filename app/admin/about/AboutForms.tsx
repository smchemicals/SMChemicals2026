"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { saveAboutValues, saveAboutTimeline, saveAboutCerts, type AboutState } from "./actions";
import type {
	AboutValuesSection,
	AboutTimelineSection,
	AboutCertsSection,
	AboutValueCard,
	TimelineItem,
	CertSpec,
} from "@/data/about";
import { BTN, BTN_QUIET, FIELD_IN_PANEL as FIELD, Field, ICON_BTN, Panel, SaveResult } from "@/components/admin/ui";

/* Every form here edits what the About page shows; a section saves on its own. */

function Remove({ onClick, what }: { onClick: () => void; what: string }) {
	return (
		<button type="button" onClick={onClick} aria-label={`Remove ${what}`} title="Remove" className={`${ICON_BTN} hover:text-danger-ink`}>
			<Trash2 size={18} aria-hidden />
		</button>
	);
}

function SaveRow({ pending, state, label }: { pending: boolean; state: AboutState; label: string }) {
	return (
		<div className="mt-8 flex flex-wrap items-center gap-4">
			<button type="submit" disabled={pending} className={BTN}>
				{pending ? "Saving…" : label}
			</button>
			<SaveResult {...state} />
		</div>
	);
}

function useSavedRefresh(state: AboutState) {
	const router = useRouter();
	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* An edit of one entry in a list, leaving the rest alone. */
function edit<T>(list: T[], i: number, patch: Partial<T>): T[] {
	return list.map((x, j) => (j === i ? { ...x, ...patch } : x));
}

/* ---------------- Purpose and direction ---------------- */

export function AboutValuesForm({ section }: { section: AboutValuesSection }) {
	const [state, action, pending] = useActionState(saveAboutValues, {} as AboutState);
	const [data, setData] = useState<AboutValuesSection>(section);
	useSavedRefresh(state);
	const setCards = (cards: AboutValueCard[]) => setData((p) => ({ ...p, cards }));

	return (
		<form action={action}>
			<input type="hidden" name="payload" value={JSON.stringify(data)} />
			<Panel title="Purpose and direction">
				<Field label="Heading">
					<input value={data.heading} onChange={(e) => setData((p) => ({ ...p, heading: e.target.value }))} className={FIELD} />
				</Field>

				<ul className="mt-8 space-y-4">
					{data.cards.map((c, i) => (
						<li key={i} className="flex items-start gap-3 rounded-lg bg-background p-4">
							<div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
								<Field label="Title">
									<input value={c.title} onChange={(e) => setCards(edit(data.cards, i, { title: e.target.value }))} className={FIELD.replace("bg-background", "bg-surface")} />
								</Field>
								<Field label="Text" className="sm:col-span-2">
									<input value={c.body} onChange={(e) => setCards(edit(data.cards, i, { body: e.target.value }))} className={FIELD.replace("bg-background", "bg-surface")} />
								</Field>
							</div>
							<div className="mt-7">
								<Remove what={c.title || "card"} onClick={() => setCards(data.cards.filter((_, j) => j !== i))} />
							</div>
						</li>
					))}
				</ul>
				<button type="button" onClick={() => setCards([...data.cards, { title: "", body: "" }])} className={`${BTN_QUIET} mt-4`}>
					<Plus size={16} aria-hidden /> Add card
				</button>

				<SaveRow pending={pending} state={state} label="Save purpose" />
			</Panel>
		</form>
	);
}

/* ---------------- Milestones ---------------- */

export function AboutTimelineForm({ section }: { section: AboutTimelineSection }) {
	const [state, action, pending] = useActionState(saveAboutTimeline, {} as AboutState);
	const [data, setData] = useState<AboutTimelineSection>(section);
	useSavedRefresh(state);
	const setItems = (items: TimelineItem[]) => setData((p) => ({ ...p, items }));
	const inner = FIELD.replace("bg-background", "bg-surface");

	return (
		<form action={action}>
			<input type="hidden" name="payload" value={JSON.stringify(data)} />
			<Panel title="Milestones">
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<Field label="Heading">
						<input value={data.heading} onChange={(e) => setData((p) => ({ ...p, heading: e.target.value }))} className={FIELD} />
					</Field>
					<Field label="Highlighted ending" hint="Shown in the brand blue after the heading.">
						<input value={data.headingAccent} onChange={(e) => setData((p) => ({ ...p, headingAccent: e.target.value }))} className={FIELD} />
					</Field>
				</div>

				<ul className="mt-8 space-y-4">
					{data.items.map((it, i) => (
						<li key={i} className="relative rounded-lg bg-background p-4 md:p-5">
							<div className="absolute right-3 top-3">
								<Remove what={it.title || "milestone"} onClick={() => setItems(data.items.filter((_, j) => j !== i))} />
							</div>
							<div className="grid grid-cols-1 gap-4 pr-12 sm:grid-cols-3">
								<Field label="Year">
									<input value={it.year} onChange={(e) => setItems(edit(data.items, i, { year: e.target.value }))} className={inner} />
								</Field>
								<Field label="Title" className="sm:col-span-2">
									<input value={it.title} onChange={(e) => setItems(edit(data.items, i, { title: e.target.value }))} className={inner} />
								</Field>
							</div>
							<Field label="Description" className="mt-4">
								<textarea value={it.description} onChange={(e) => setItems(edit(data.items, i, { description: e.target.value }))} rows={2} className={`${inner} resize-none`} />
							</Field>
						</li>
					))}
				</ul>
				<button type="button" onClick={() => setItems([...data.items, { year: "", title: "", description: "" }])} className={`${BTN_QUIET} mt-4`}>
					<Plus size={16} aria-hidden /> Add milestone
				</button>

				<SaveRow pending={pending} state={state} label="Save milestones" />
			</Panel>
		</form>
	);
}

/* ---------------- Certifications ---------------- */

export function AboutCertsForm({ section }: { section: AboutCertsSection }) {
	const [state, action, pending] = useActionState(saveAboutCerts, {} as AboutState);
	const [data, setData] = useState<AboutCertsSection>(section);
	useSavedRefresh(state);
	const setSpecs = (specs: CertSpec[]) => setData((p) => ({ ...p, specs }));
	const inner = FIELD.replace("bg-background", "bg-surface");

	return (
		<form action={action}>
			<input type="hidden" name="payload" value={JSON.stringify(data)} />
			<Panel title="Certifications">
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<Field label="Heading">
						<input value={data.heading} onChange={(e) => setData((p) => ({ ...p, heading: e.target.value }))} className={FIELD} />
					</Field>
					<Field label="Highlighted ending" hint="Shown in the brand blue under the heading.">
						<input value={data.headingAccent} onChange={(e) => setData((p) => ({ ...p, headingAccent: e.target.value }))} className={FIELD} />
					</Field>
				</div>

				<Field label="Text beside the heading" className="mt-6">
					<textarea value={data.body} onChange={(e) => setData((p) => ({ ...p, body: e.target.value }))} rows={3} className={`${FIELD} resize-none`} />
				</Field>

				<ul className="mt-8 space-y-4">
					{data.specs.map((sp, i) => (
						<li key={i} className="flex items-start gap-3 rounded-lg bg-background p-4">
							<div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
								<Field label="Standard">
									<input value={sp.title} onChange={(e) => setSpecs(edit(data.specs, i, { title: e.target.value }))} className={inner} />
								</Field>
								<Field label="Detail">
									<input value={sp.detail} onChange={(e) => setSpecs(edit(data.specs, i, { detail: e.target.value }))} className={inner} />
								</Field>
							</div>
							<div className="mt-7">
								<Remove what={sp.title || "standard"} onClick={() => setSpecs(data.specs.filter((_, j) => j !== i))} />
							</div>
						</li>
					))}
				</ul>
				<button type="button" onClick={() => setSpecs([...data.specs, { title: "", detail: "" }])} className={`${BTN_QUIET} mt-4`}>
					<Plus size={16} aria-hidden /> Add standard
				</button>

				<SaveRow pending={pending} state={state} label="Save certifications" />
			</Panel>
		</form>
	);
}
