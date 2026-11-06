"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";
import { getSetting } from "@/lib/cms/settings";
import {
	defaultAbout,
	type AboutContent,
	type AboutValuesSection,
	type AboutTimelineSection,
	type AboutCertsSection,
} from "@/data/about";

export type AboutState = { ok?: string; error?: string };

const DEV_NOTICE = "Dev mode, connect Supabase to save content.";
const s = (v: unknown) => String(v ?? "").trim();

function parse<T>(formData: FormData): T | null {
	try {
		return JSON.parse(String(formData.get("payload") ?? "")) as T;
	} catch {
		return null;
	}
}

// Merge a single section into the shared `about` document, leaving the others
// untouched, so each section can be saved independently.
async function writeSection(patch: Partial<AboutContent>): Promise<AboutState> {
	const current = await getSetting<AboutContent>("about", defaultAbout);
	const next: AboutContent = { ...current, ...patch };
	const admin = createAdminClient();
	const { error } = await admin
		.from("site_settings")
		.upsert({ key: "about", value: next }, { onConflict: "key" });
	if (error) return { error: error.message };
	revalidatePath("/admin/about");
	return { ok: "Saved." };
}

export async function saveAboutValues(
	_prev: AboutState,
	formData: FormData,
): Promise<AboutState> {
	await requirePermission("about");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	const p = parse<AboutValuesSection>(formData);
	if (!p) return { error: "Could not read the form data." };

	const values: AboutValuesSection = {
		eyebrow: s(p.eyebrow),
		heading: s(p.heading),
		cards: (p.cards ?? [])
			.map((c) => ({ title: s(c?.title), body: s(c?.body) }))
			.filter((c) => c.title || c.body),
	};
	if (!values.heading) return { error: "Heading is required." };

	const res = await writeSection({ values });
	if (res.ok) await logActivity("edit", "About", "Updated purpose & direction");
	return res;
}

export async function saveAboutTimeline(
	_prev: AboutState,
	formData: FormData,
): Promise<AboutState> {
	await requirePermission("about");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	const p = parse<AboutTimelineSection>(formData);
	if (!p) return { error: "Could not read the form data." };

	const timeline: AboutTimelineSection = {
		eyebrow: s(p.eyebrow),
		heading: s(p.heading),
		headingAccent: s(p.headingAccent),
		items: (p.items ?? [])
			.map((it) => ({
				year: s(it?.year),
				title: s(it?.title),
				description: s(it?.description),
			}))
			.filter((it) => it.year || it.title || it.description),
	};
	if (!timeline.heading) return { error: "Heading is required." };

	const res = await writeSection({ timeline });
	if (res.ok) await logActivity("edit", "About", "Updated milestones");
	return res;
}

export async function saveAboutCerts(
	_prev: AboutState,
	formData: FormData,
): Promise<AboutState> {
	await requirePermission("about");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	const p = parse<AboutCertsSection>(formData);
	if (!p) return { error: "Could not read the form data." };

	const certifications: AboutCertsSection = {
		eyebrow: s(p.eyebrow),
		heading: s(p.heading),
		headingAccent: s(p.headingAccent),
		body: s(p.body),
		specs: (p.specs ?? [])
			.map((sp) => ({ title: s(sp?.title), detail: s(sp?.detail) }))
			.filter((sp) => sp.title || sp.detail),
	};
	if (!certifications.heading) return { error: "Heading is required." };

	const res = await writeSection({ certifications });
	if (res.ok) await logActivity("edit", "About", "Updated certifications");
	return res;
}
