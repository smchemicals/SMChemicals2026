"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";
import type {
	CareersContent,
	CareersIntro,
	CareersValue,
	JobOpening,
} from "@/data/careers";

export type CareersState = { ok?: string; error?: string };

const DEV_NOTICE = "Dev mode, connect Supabase to save content.";

function slugify(s: string): string {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function saveCareers(
	_prev: CareersState,
	formData: FormData,
): Promise<CareersState> {
	await requirePermission("careers");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	let parsed: Partial<CareersContent>;
	try {
		parsed = JSON.parse(String(formData.get("payload") ?? ""));
	} catch {
		return { error: "Could not read the form data." };
	}

	const rawValues = parsed.intro?.values ?? [];
	const values: CareersValue[] = rawValues
		.map((v) => ({
			title: String(v?.title ?? "").trim(),
			detail: String(v?.detail ?? "").trim(),
		}))
		.filter((v) => v.title || v.detail);

	const intro: CareersIntro = {
		eyebrow: String(parsed.intro?.eyebrow ?? "").trim(),
		heading: String(parsed.intro?.heading ?? "").trim(),
		headingAccent: String(parsed.intro?.headingAccent ?? "").trim(),
		body: String(parsed.intro?.body ?? "").trim(),
		values,
	};

	const seen = new Set<string>();
	const openings: JobOpening[] = (parsed.openings ?? [])
		.map((o) => {
			const title = String(o?.title ?? "").trim();
			const base = slugify(String(o?.id ?? "") || title) || "role";
			let id = base;
			let n = 2;
			while (seen.has(id)) id = `${base}-${n++}`;
			seen.add(id);
			return {
				id,
				title,
				department: String(o?.department ?? "").trim(),
				type: String(o?.type ?? "").trim(),
				location: String(o?.location ?? "").trim(),
				description: String(o?.description ?? "").trim(),
			};
		})
		.filter((o) => o.title);

	if (!intro.heading) return { error: "Intro heading is required." };
	if (!intro.body) return { error: "Intro body is required." };

	const content: CareersContent = { intro, openings };

	const admin = createAdminClient();
	const { error } = await admin
		.from("site_settings")
		.upsert({ key: "careers", value: content }, { onConflict: "key" });
	if (error) return { error: error.message };

	revalidatePath("/admin/careers");
	await logActivity("edit", "Careers", "Updated careers content");
	return { ok: "Saved." };
}
