"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveHome, saveContact, type ContentState } from "./actions";
import type { HomeContent, ContactContent } from "@/data/content";

const inputCls =
	"w-full border-b border-white/15 bg-transparent py-2.5 text-white text-sm font-light outline-none transition-colors placeholder:text-white/40 focus:border-accent-500";
const labelCls =
	"type-label text-white/60";
const btnCls =
	"type-label inline-flex items-center gap-2 bg-cta px-7 py-3.5 text-white transition-colors hover:bg-cta-hover disabled:opacity-50 cursor-pointer";

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

function Status({ state }: { state: ContentState }) {
	if (state.error) return <span className="text-red-400 text-xs">{state.error}</span>;
	if (state.ok) return <span className="text-accent-500 text-xs">{state.ok}</span>;
	return null;
}

export function HomeForm({ home }: { home: HomeContent }) {
	const router = useRouter();
	const [state, action, pending] = useActionState(saveHome, {} as ContentState);
	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<form action={action} className="border border-white/10 bg-white/[0.02] p-8">
			<Eyebrow>Home</Eyebrow>

			<label className="mb-6 flex flex-col gap-1.5">
				<span className={labelCls}>Hero tagline</span>
				<textarea
					name="tagline"
					defaultValue={home.tagline}
					rows={2}
					className={`${inputCls} resize-none`}
				/>
			</label>

			<label className="mb-8 flex flex-col gap-1.5">
				<span className={labelCls}>Rotating sectors (one per line)</span>
				<textarea
					name="sectors"
					defaultValue={home.sectors.join("\n")}
					rows={5}
					className={`${inputCls} resize-none`}
				/>
			</label>

			<div className="mb-2 flex items-center gap-3">
				<span className="h-px w-5 bg-accent-500/60" />
				<span className="type-label text-white/75">
					Stats
				</span>
			</div>
			<input type="hidden" name="statCount" value={home.stats.length} />
			<div className="divide-y divide-white/10">
				{home.stats.map((s, i) => (
					<div
						key={i}
						className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-4"
					>
						<label className="flex flex-col gap-1">
							<span className={labelCls}>Label</span>
							<input name={`stat_label_${i}`} defaultValue={s.label} className={inputCls} />
						</label>
						<label className="flex flex-col gap-1">
							<span className={labelCls}>Value</span>
							<input
								name={`stat_value_${i}`}
								type="number"
								step="any"
								defaultValue={s.value}
								className={inputCls}
							/>
						</label>
						<label className="flex flex-col gap-1">
							<span className={labelCls}>Suffix</span>
							<input name={`stat_suffix_${i}`} defaultValue={s.suffix} className={inputCls} />
						</label>
						<label className="flex flex-col gap-1">
							<span className={labelCls}>Decimals</span>
							<input
								name={`stat_decimals_${i}`}
								type="number"
								min={0}
								defaultValue={s.decimals ?? 0}
								className={inputCls}
							/>
						</label>
					</div>
				))}
			</div>

			<div className="mt-8 flex items-center gap-4">
				<button type="submit" disabled={pending} className={btnCls}>
					{pending ? "Saving…" : "Save home"}
				</button>
				<Status state={state} />
			</div>
		</form>
	);
}

export function ContactForm({ contact }: { contact: ContactContent }) {
	const router = useRouter();
	const [state, action, pending] = useActionState(saveContact, {} as ContentState);
	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<form action={action} className="border border-white/10 bg-white/[0.02] p-8">
			<Eyebrow>Contact</Eyebrow>

			<label className="mb-6 flex flex-col gap-1.5">
				<span className={labelCls}>Address (one line per row)</span>
				<textarea
					name="address"
					defaultValue={contact.addressLines.join("\n")}
					rows={3}
					className={`${inputCls} resize-none`}
				/>
			</label>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Phone</span>
					<input name="phone" defaultValue={contact.phone} className={inputCls} />
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Email</span>
					<input name="email" type="email" defaultValue={contact.email} className={inputCls} />
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Working hours</span>
					<input name="hours" defaultValue={contact.hours} className={inputCls} />
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Map CID (embed)</span>
					<input name="mapCid" defaultValue={contact.mapCid} className={inputCls} />
				</label>
			</div>

			<label className="mt-6 flex flex-col gap-1.5">
				<span className={labelCls}>Google Maps link</span>
				<input name="mapsUrl" defaultValue={contact.mapsUrl} className={inputCls} />
			</label>

			<div className="mt-8 flex items-center gap-4">
				<button type="submit" disabled={pending} className={btnCls}>
					{pending ? "Saving…" : "Save contact"}
				</button>
				<Status state={state} />
			</div>
		</form>
	);
}
