"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
	saveAboutValues,
	saveAboutTimeline,
	saveAboutCerts,
	type AboutState,
} from "./actions";
import type {
	AboutValuesSection,
	AboutTimelineSection,
	AboutCertsSection,
	AboutValueCard,
	TimelineItem,
	CertSpec,
} from "@/data/about";

const inputCls =
	"w-full border-b border-white/15 bg-transparent py-2.5 text-white text-sm font-light outline-none transition-colors placeholder:text-white/40 focus:border-accent-500";
const labelCls =
	"type-label text-white/60";
const btnCls =
	"type-label inline-flex items-center gap-2 bg-cta px-7 py-3.5 text-white transition-colors hover:bg-cta-hover disabled:opacity-50 cursor-pointer";
const ghostBtnCls =
	"type-label inline-flex items-center gap-2 border border-white/15 px-4 py-2.5 text-white/75 transition-colors hover:border-accent-500 hover:text-accent-500 cursor-pointer";

function Eyebrow({ children }: { children: React.ReactNode }) {
	return (
		<div className="mb-8 flex items-center gap-3">
			<span className="h-px w-6 bg-accent-500" />
			<h2 className="type-label text-accent-500">
				{children}
			</h2>
		</div>
	);
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label="Remove"
			className="shrink-0 text-white/50 transition-colors hover:text-red-400 cursor-pointer"
		>
			<Trash2 size={15} />
		</button>
	);
}

function SaveRow({
	pending,
	state,
	label,
}: {
	pending: boolean;
	state: AboutState;
	label: string;
}) {
	return (
		<div className="mt-8 flex items-center gap-4">
			<button type="submit" disabled={pending} className={btnCls}>
				{pending ? "Saving…" : label}
			</button>
			{state.error && <span className="text-red-400 text-xs">{state.error}</span>}
			{state.ok && <span className="text-accent-500 text-xs">{state.ok}</span>}
		</div>
	);
}

function useSavedRefresh(state: AboutState) {
	const router = useRouter();
	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ---------------- Purpose & Direction ---------------- */

export function AboutValuesForm({ section }: { section: AboutValuesSection }) {
	const [state, action, pending] = useActionState(
		saveAboutValues,
		{} as AboutState,
	);
	const [data, setData] = useState<AboutValuesSection>(section);
	useSavedRefresh(state);

	const setCards = (cards: AboutValueCard[]) =>
		setData((p) => ({ ...p, cards }));

	return (
		<form
			action={action}
			className="border border-white/10 bg-white/[0.02] p-8"
		>
			<input type="hidden" name="payload" value={JSON.stringify(data)} />
			<Eyebrow>Purpose & direction</Eyebrow>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Eyebrow</span>
					<input
						value={data.eyebrow}
						onChange={(e) => setData((p) => ({ ...p, eyebrow: e.target.value }))}
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Heading</span>
					<input
						value={data.heading}
						onChange={(e) => setData((p) => ({ ...p, heading: e.target.value }))}
						className={inputCls}
					/>
				</label>
			</div>

			<div className="mt-8 mb-2 flex items-center gap-3">
				<span className="h-px w-5 bg-accent-500/60" />
				<span className="type-label text-white/75">
					Cards
				</span>
			</div>
			<div className="divide-y divide-white/10">
				{data.cards.map((c, i) => (
					<div key={i} className="flex items-start gap-4 py-4">
						<div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
							<label className="flex flex-col gap-1">
								<span className={labelCls}>Title</span>
								<input
									value={c.title}
									onChange={(e) =>
										setCards(
											data.cards.map((x, j) =>
												j === i ? { ...x, title: e.target.value } : x,
											),
										)
									}
									className={inputCls}
								/>
							</label>
							<label className="flex flex-col gap-1 sm:col-span-2">
								<span className={labelCls}>Body</span>
								<input
									value={c.body}
									onChange={(e) =>
										setCards(
											data.cards.map((x, j) =>
												j === i ? { ...x, body: e.target.value } : x,
											),
										)
									}
									className={inputCls}
								/>
							</label>
						</div>
						<div className="mt-5">
							<RemoveBtn onClick={() => setCards(data.cards.filter((_, j) => j !== i))} />
						</div>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={() => setCards([...data.cards, { title: "", body: "" }])}
				className={`${ghostBtnCls} mt-5`}
			>
				<Plus size={13} /> Add card
			</button>

			<SaveRow pending={pending} state={state} label="Save purpose" />
		</form>
	);
}

/* ---------------- Milestones ---------------- */

export function AboutTimelineForm({
	section,
}: {
	section: AboutTimelineSection;
}) {
	const [state, action, pending] = useActionState(
		saveAboutTimeline,
		{} as AboutState,
	);
	const [data, setData] = useState<AboutTimelineSection>(section);
	useSavedRefresh(state);

	const setItems = (items: TimelineItem[]) =>
		setData((p) => ({ ...p, items }));

	return (
		<form
			action={action}
			className="border border-white/10 bg-white/[0.02] p-8"
		>
			<input type="hidden" name="payload" value={JSON.stringify(data)} />
			<Eyebrow>Milestones</Eyebrow>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Eyebrow</span>
					<input
						value={data.eyebrow}
						onChange={(e) => setData((p) => ({ ...p, eyebrow: e.target.value }))}
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Heading</span>
					<input
						value={data.heading}
						onChange={(e) => setData((p) => ({ ...p, heading: e.target.value }))}
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Heading accent</span>
					<input
						value={data.headingAccent}
						onChange={(e) =>
							setData((p) => ({ ...p, headingAccent: e.target.value }))
						}
						className={inputCls}
					/>
				</label>
			</div>

			<div className="mt-8 mb-2 flex items-center gap-3">
				<span className="h-px w-5 bg-accent-500/60" />
				<span className="type-label text-white/75">
					Entries
				</span>
			</div>
			<div className="space-y-px">
				{data.items.map((it, i) => (
					<div
						key={i}
						className="relative border border-white/10 bg-white/[0.02] p-6"
					>
						<div className="absolute right-5 top-5">
							<RemoveBtn onClick={() => setItems(data.items.filter((_, j) => j !== i))} />
						</div>
						<div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
							<label className="flex flex-col gap-1.5">
								<span className={labelCls}>Year</span>
								<input
									value={it.year}
									onChange={(e) =>
										setItems(
											data.items.map((x, j) =>
												j === i ? { ...x, year: e.target.value } : x,
											),
										)
									}
									className={inputCls}
								/>
							</label>
							<label className="flex flex-col gap-1.5 sm:col-span-2">
								<span className={labelCls}>Title</span>
								<input
									value={it.title}
									onChange={(e) =>
										setItems(
											data.items.map((x, j) =>
												j === i ? { ...x, title: e.target.value } : x,
											),
										)
									}
									className={inputCls}
								/>
							</label>
						</div>
						<label className="mt-5 flex flex-col gap-1.5">
							<span className={labelCls}>Description</span>
							<textarea
								value={it.description}
								onChange={(e) =>
									setItems(
										data.items.map((x, j) =>
											j === i ? { ...x, description: e.target.value } : x,
										),
									)
								}
								rows={2}
								className={`${inputCls} resize-none`}
							/>
						</label>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={() =>
					setItems([...data.items, { year: "", title: "", description: "" }])
				}
				className={`${ghostBtnCls} mt-5`}
			>
				<Plus size={13} /> Add milestone
			</button>

			<SaveRow pending={pending} state={state} label="Save milestones" />
		</form>
	);
}

/* ---------------- Certifications ---------------- */

export function AboutCertsForm({ section }: { section: AboutCertsSection }) {
	const [state, action, pending] = useActionState(
		saveAboutCerts,
		{} as AboutState,
	);
	const [data, setData] = useState<AboutCertsSection>(section);
	useSavedRefresh(state);

	const setSpecs = (specs: CertSpec[]) => setData((p) => ({ ...p, specs }));

	return (
		<form
			action={action}
			className="border border-white/10 bg-white/[0.02] p-8"
		>
			<input type="hidden" name="payload" value={JSON.stringify(data)} />
			<Eyebrow>Certifications</Eyebrow>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Eyebrow</span>
					<input
						value={data.eyebrow}
						onChange={(e) => setData((p) => ({ ...p, eyebrow: e.target.value }))}
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Heading</span>
					<input
						value={data.heading}
						onChange={(e) => setData((p) => ({ ...p, heading: e.target.value }))}
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Heading accent</span>
					<input
						value={data.headingAccent}
						onChange={(e) =>
							setData((p) => ({ ...p, headingAccent: e.target.value }))
						}
						className={inputCls}
					/>
				</label>
			</div>

			<label className="mt-6 flex flex-col gap-1.5">
				<span className={labelCls}>Body</span>
				<textarea
					value={data.body}
					onChange={(e) => setData((p) => ({ ...p, body: e.target.value }))}
					rows={3}
					className={`${inputCls} resize-none`}
				/>
			</label>

			<div className="mt-8 mb-2 flex items-center gap-3">
				<span className="h-px w-5 bg-accent-500/60" />
				<span className="type-label text-white/75">
					Spec tiles
				</span>
			</div>
			<div className="divide-y divide-white/10">
				{data.specs.map((sp, i) => (
					<div key={i} className="flex items-start gap-4 py-4">
						<div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
							<label className="flex flex-col gap-1">
								<span className={labelCls}>Title</span>
								<input
									value={sp.title}
									onChange={(e) =>
										setSpecs(
											data.specs.map((x, j) =>
												j === i ? { ...x, title: e.target.value } : x,
											),
										)
									}
									className={inputCls}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className={labelCls}>Detail</span>
								<input
									value={sp.detail}
									onChange={(e) =>
										setSpecs(
											data.specs.map((x, j) =>
												j === i ? { ...x, detail: e.target.value } : x,
											),
										)
									}
									className={inputCls}
								/>
							</label>
						</div>
						<div className="mt-5">
							<RemoveBtn onClick={() => setSpecs(data.specs.filter((_, j) => j !== i))} />
						</div>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={() => setSpecs([...data.specs, { title: "", detail: "" }])}
				className={`${ghostBtnCls} mt-5`}
			>
				<Plus size={13} /> Add spec tile
			</button>

			<SaveRow pending={pending} state={state} label="Save certifications" />
		</form>
	);
}
