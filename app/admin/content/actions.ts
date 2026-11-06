"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";
import type { ContactContent, HomeContent, StatItem } from "@/data/content";

export type ContentState = { ok?: string; error?: string };

const DEV_NOTICE = "Dev mode, connect Supabase to save content.";

async function writeSetting(key: string, value: unknown): Promise<ContentState> {
	const admin = createAdminClient();
	const { error } = await admin
		.from("site_settings")
		.upsert({ key, value }, { onConflict: "key" });
	if (error) return { error: error.message };
	revalidatePath("/admin/content");
	return { ok: "Saved." };
}

function lines(v: FormDataEntryValue | null): string[] {
	return String(v ?? "")
		.split("\n")
		.map((s) => s.trim())
		.filter(Boolean);
}

export async function saveHome(
	_prev: ContentState,
	formData: FormData,
): Promise<ContentState> {
	await requirePermission("content");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const count = Number(formData.get("statCount") ?? 0);
	const stats: StatItem[] = [];
	for (let i = 0; i < count; i++) {
		const label = String(formData.get(`stat_label_${i}`) ?? "").trim();
		const value = Number(formData.get(`stat_value_${i}`) ?? 0);
		const suffix = String(formData.get(`stat_suffix_${i}`) ?? "").trim();
		const decimals = Number(formData.get(`stat_decimals_${i}`) ?? 0);
		if (!label) continue;
		stats.push({
			label,
			value: Number.isFinite(value) ? value : 0,
			suffix,
			...(decimals > 0 ? { decimals } : {}),
		});
	}

	const home: HomeContent = {
		heroText: String(formData.get("heroText") ?? "").trim(),
		sectors: lines(formData.get("sectors")).map((w) => w.replace(/\.$/, "")),
		stats,
	};

	if (home.sectors.length < 2) return { error: "Add at least two sectors, one per line, so the hero has something to rotate." };
	if (home.sectors.some((w) => w.length > 28)) return { error: "Keep each sector under 28 characters so it fits on a phone." };
	if (!home.heroText) return { error: "The hero paragraph can't be empty." };
	if (home.stats.length === 0) return { error: "Add at least one stat." };

	const res = await writeSetting("home", home);
	if (res.ok) await logActivity("edit", "Home", "Updated home content");
	return res;
}

export async function saveContact(
	_prev: ContentState,
	formData: FormData,
): Promise<ContentState> {
	await requirePermission("content");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };

	const contact: ContactContent = {
		addressLines: lines(formData.get("address")),
		phone: String(formData.get("phone") ?? "").trim(),
		email: String(formData.get("email") ?? "").trim(),
		hours: String(formData.get("hours") ?? "").trim(),
		mapsUrl: String(formData.get("mapsUrl") ?? "").trim(),
	};

	if (!contact.email) return { error: "Email is required." };
	if (contact.mapsUrl && !/^https:\/\//i.test(contact.mapsUrl)) return { error: "The Maps link must start with https://, or be left empty." };

	const res = await writeSetting("contact", contact);
	if (res.ok) await logActivity("edit", "Contact", "Updated contact details");
	return res;
}
