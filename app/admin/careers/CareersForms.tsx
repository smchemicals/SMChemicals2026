"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { saveCareers, type CareersState } from "./actions";
import type {
	CareersContent,
	CareersIntro,
	CareersValue,
	JobOpening,
} from "@/data/careers";

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

function Status({ state }: { state: CareersState }) {
	if (state.error) return <span className="text-red-400 text-xs">{state.error}</span>;
	if (state.ok) return <span className="text-accent-500 text-xs">{state.ok}</span>;
	return null;
}

const emptyValue: CareersValue = { title: "", detail: "" };
const emptyOpening: JobOpening = {
	id: "",
	title: "",
	department: "",
	type: "Full-time",
	location: "",
	description: "",
};

export function CareersForm({ careers }: { careers: CareersContent }) {
	const router = useRouter();
	const [state, action, pending] = useActionState(
		saveCareers,
		{} as CareersState,
	);

	const [intro, setIntro] = useState<CareersIntro>(careers.intro);
	const [openings, setOpenings] = useState<JobOpening[]>(careers.openings);

	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	const setIntroField = (k: keyof CareersIntro, v: string) =>
		setIntro((p) => ({ ...p, [k]: v }));

	const setValue = (i: number, k: keyof CareersValue, v: string) =>
		setIntro((p) => ({
			...p,
			values: p.values.map((x, j) => (j === i ? { ...x, [k]: v } : x)),
		}));
	const addValue = () =>
		setIntro((p) => ({ ...p, values: [...p.values, { ...emptyValue }] }));
	const removeValue = (i: number) =>
		setIntro((p) => ({ ...p, values: p.values.filter((_, j) => j !== i) }));

	const setOpening = (i: number, k: keyof JobOpening, v: string) =>
		setOpenings((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
	const addOpening = () => setOpenings((p) => [...p, { ...emptyOpening }]);
	const removeOpening = (i: number) =>
		setOpenings((p) => p.filter((_, j) => j !== i));

	const payload = JSON.stringify({ intro, openings });

	return (
		<form action={action} className="space-y-10">
			<input type="hidden" name="payload" value={payload} />

			<section className="border border-white/10 bg-white/[0.02] p-8">
				<Eyebrow>Intro</Eyebrow>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<label className="flex flex-col gap-1.5">
						<span className={labelCls}>Eyebrow</span>
						<input
							value={intro.eyebrow}
							onChange={(e) => setIntroField("eyebrow", e.target.value)}
							className={inputCls}
						/>
					</label>
					<label className="flex flex-col gap-1.5">
						<span className={labelCls}>Heading accent (lighter second part)</span>
						<input
							value={intro.headingAccent}
							onChange={(e) => setIntroField("headingAccent", e.target.value)}
							className={inputCls}
						/>
					</label>
				</div>

				<label className="mt-6 flex flex-col gap-1.5">
					<span className={labelCls}>Heading</span>
					<input
						value={intro.heading}
						onChange={(e) => setIntroField("heading", e.target.value)}
						className={inputCls}
					/>
				</label>

				<label className="mt-6 flex flex-col gap-1.5">
					<span className={labelCls}>Body</span>
					<textarea
						value={intro.body}
						onChange={(e) => setIntroField("body", e.target.value)}
						rows={4}
						className={`${inputCls} resize-none`}
					/>
				</label>

				<div className="mt-8 mb-2 flex items-center gap-3">
					<span className="h-px w-5 bg-accent-500/60" />
					<span className="type-label text-white/75">
						Culture values
					</span>
				</div>
				<div className="divide-y divide-white/10">
					{intro.values.map((v, i) => (
						<div key={i} className="flex items-start gap-4 py-4">
							<div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
								<label className="flex flex-col gap-1">
									<span className={labelCls}>Title</span>
									<input
										value={v.title}
										onChange={(e) => setValue(i, "title", e.target.value)}
										className={inputCls}
									/>
								</label>
								<label className="flex flex-col gap-1 sm:col-span-2">
									<span className={labelCls}>Detail</span>
									<input
										value={v.detail}
										onChange={(e) => setValue(i, "detail", e.target.value)}
										className={inputCls}
									/>
								</label>
							</div>
							<button
								type="button"
								onClick={() => removeValue(i)}
								aria-label="Remove value"
								className="mt-5 shrink-0 text-white/50 transition-colors hover:text-red-400 cursor-pointer"
							>
								<Trash2 size={15} />
							</button>
						</div>
					))}
				</div>
				<button type="button" onClick={addValue} className={`${ghostBtnCls} mt-5`}>
					<Plus size={13} /> Add value
				</button>
			</section>

			<section className="border border-white/10 bg-white/[0.02] p-8">
				<Eyebrow>Open positions</Eyebrow>

				<div className="space-y-px">
					{openings.map((o, i) => (
						<div
							key={i}
							className="relative border border-white/10 bg-white/[0.02] p-6"
						>
							<button
								type="button"
								onClick={() => removeOpening(i)}
								aria-label="Remove role"
								className="absolute right-5 top-5 text-white/50 transition-colors hover:text-red-400 cursor-pointer"
							>
								<Trash2 size={15} />
							</button>

							<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
								<label className="flex flex-col gap-1.5">
									<span className={labelCls}>Title</span>
									<input
										value={o.title}
										onChange={(e) => setOpening(i, "title", e.target.value)}
										className={inputCls}
									/>
								</label>
								<label className="flex flex-col gap-1.5">
									<span className={labelCls}>Department</span>
									<input
										value={o.department}
										onChange={(e) =>
											setOpening(i, "department", e.target.value)
										}
										className={inputCls}
									/>
								</label>
								<label className="flex flex-col gap-1.5">
									<span className={labelCls}>Type</span>
									<input
										value={o.type}
										onChange={(e) => setOpening(i, "type", e.target.value)}
										className={inputCls}
									/>
								</label>
								<label className="flex flex-col gap-1.5">
									<span className={labelCls}>Location</span>
									<input
										value={o.location}
										onChange={(e) => setOpening(i, "location", e.target.value)}
										className={inputCls}
									/>
								</label>
							</div>

							<label className="mt-5 flex flex-col gap-1.5">
								<span className={labelCls}>Description</span>
								<textarea
									value={o.description}
									onChange={(e) =>
										setOpening(i, "description", e.target.value)
									}
									rows={3}
									className={`${inputCls} resize-none`}
								/>
							</label>
						</div>
					))}
				</div>

				{openings.length === 0 && (
					<p className="text-white/55 text-xs font-light">
						No open roles. The careers page will show an empty state.
					</p>
				)}

				<button
					type="button"
					onClick={addOpening}
					className={`${ghostBtnCls} mt-5`}
				>
					<Plus size={13} /> Add role
				</button>
			</section>

			<div className="flex items-center gap-4">
				<button type="submit" disabled={pending} className={btnCls}>
					{pending ? "Saving…" : "Save careers"}
				</button>
				<Status state={state} />
			</div>
		</form>
	);
}
