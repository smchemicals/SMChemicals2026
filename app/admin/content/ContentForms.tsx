"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveHome, saveContact, type ContentState } from "./actions";
import { mapsSearchUrl, type HomeContent, type ContactContent } from "@/data/content";
import { BTN, FIELD_IN_PANEL as FIELD, Field, Panel, SaveResult } from "@/components/admin/ui";

export function HomeForm({ home }: { home: HomeContent }) {
	const router = useRouter();
	const [state, action, pending] = useActionState(saveHome, {} as ContentState);
	const [sectors, setSectors] = useState(home.sectors.join("\n"));
	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	const list = sectors.split("\n").map((l) => l.trim().replace(/\.$/, "")).filter(Boolean);
	const sentence =
		list.length < 2
			? list.join("")
			: list.length === 2
				? `${list[0]} and ${list[1]}`
				: `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;

	return (
		<form action={action} className="space-y-16">
			<Panel title="Hero and sectors">
				<div className="grid gap-6 lg:grid-cols-2">
					<Field
						label="Sectors we supply"
						hint="One per line, at least two. This one list is used twice: as the words that take turns at the end of the hero headline, and in the sentence under the hero."
					>
						<textarea name="sectors" value={sectors} onChange={(e) => setSectors(e.target.value)} rows={8} className={`${FIELD} resize-none`} />
					</Field>
					<Field label="Paragraph under the hero headline">
						<textarea name="heroText" defaultValue={home.heroText} rows={8} className={`${FIELD} resize-none`} />
					</Field>
				</div>

				<div className="mt-6 space-y-3">
					<p className="text-base text-foreground">
						<span className="text-muted">In the hero: High-precision chemistry for </span>
						{list.map((w, i) => (
							<span key={i}>
								{w}.{i < list.length - 1 && <span className="text-muted"> / </span>}
							</span>
						))}
					</p>
					{sentence && (
						<p className="text-base text-foreground">
							<span className="text-muted">Under the hero: We supply </span>chemicals<span className="text-muted"> for </span>
							{sentence}.
						</p>
					)}
				</div>
			</Panel>

			<Panel title="Figures">
				<p className="-mt-3 mb-6 text-base text-muted">The numbers that count up in the band under the sentence about who we supply. A value of 15 with the suffix Yrs reads as 15 Yrs.</p>
				<input type="hidden" name="statCount" value={home.stats.length} />
				<div className="space-y-3">
					{home.stats.map((s, i) => (
						<div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<Field label="Label">
								<input name={`stat_label_${i}`} defaultValue={s.label} className={FIELD} />
							</Field>
							<Field label="Value">
								<input name={`stat_value_${i}`} type="number" step="any" defaultValue={s.value} className={FIELD} />
							</Field>
							<Field label="Suffix">
								<input name={`stat_suffix_${i}`} defaultValue={s.suffix} className={FIELD} />
							</Field>
							<Field label="Decimals">
								<input name={`stat_decimals_${i}`} type="number" min={0} defaultValue={s.decimals ?? 0} className={FIELD} />
							</Field>
						</div>
					))}
				</div>
			</Panel>

			<div className="flex flex-wrap items-center gap-4">
				<button type="submit" disabled={pending} className={BTN}>
					{pending ? "Saving…" : "Save home page"}
				</button>
				<SaveResult {...state} />
			</div>
		</form>
	);
}

export function ContactForm({ contact }: { contact: ContactContent }) {
	const router = useRouter();
	const [state, action, pending] = useActionState(saveContact, {} as ContentState);
	const [address, setAddress] = useState(contact.addressLines.join("\n"));
	const lines = address.split("\n").map((l) => l.trim()).filter(Boolean);
	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<form action={action}>
			<Panel title="Contact details">
				<Field label="Address" hint="One line per row. These exact lines show on the Contact page, in the footer and in the menu, and go to search results.">
					<textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className={`${FIELD} resize-none`} />
				</Field>

				<div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
					<Field label="Phone">
						<input name="phone" type="tel" defaultValue={contact.phone} className={FIELD} />
					</Field>
					<Field label="Email">
						<input name="email" type="email" defaultValue={contact.email} className={FIELD} />
					</Field>
					<Field label="Working hours">
						<input name="hours" defaultValue={contact.hours} className={FIELD} />
					</Field>
				</div>

				<Field
					label="Google Maps link (optional)"
					hint="The link the address opens. Leave it empty to search for the address above instead."
					className="mt-6"
				>
					<input name="mapsUrl" type="url" defaultValue={contact.mapsUrl} placeholder="https://www.google.com/maps/…" className={FIELD} />
				</Field>
				{lines.length > 0 && (
					<a href={mapsSearchUrl(lines)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-medium text-accent-ink underline-offset-4 hover:underline">
						See this address on Google Maps
					</a>
				)}

				<div className="mt-8 flex flex-wrap items-center gap-4">
					<button type="submit" disabled={pending} className={BTN}>
						{pending ? "Saving…" : "Save contact details"}
					</button>
					<SaveResult {...state} />
				</div>
			</Panel>
		</form>
	);
}
