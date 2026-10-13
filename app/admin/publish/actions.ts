"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/cms/products";
import { logActivity } from "@/lib/cms/activity";
import {
	buildDraft,
	captureRaw,
	SNAPSHOT_KEYS,
	SNAPSHOT_LABELS,
	type SnapshotKey,
} from "@/lib/cms/snapshots";

export type PublishState = { ok?: boolean; error?: string; at?: string };

const DEV_NOTICE = "Dev mode — connect Supabase to publish.";

function revalidateForKey(key: SnapshotKey) {
	switch (key) {
		case "home":
			revalidatePath("/");
			break;
		case "contact":
			// Footer (root layout) + home CTA + contact page all read contact.
			revalidatePath("/", "layout");
			break;
		case "about":
			revalidatePath("/about");
			break;
		case "careers":
			revalidatePath("/careers");
			break;
		case "products":
			revalidatePath("/products");
			// The homepage's Industrial Scopes reads the published catalog too.
			revalidatePath("/");
			break;
	}
}

async function snapshot(key: SnapshotKey): Promise<string | null> {
	const [data, raw] = await Promise.all([buildDraft(key), captureRaw(key)]);
	const at = new Date().toISOString();
	const admin = createAdminClient();
	const { error } = await admin
		.from("page_snapshots")
		.upsert({ page: key, data, raw, published_at: at }, { onConflict: "page" });
	if (error) return null;
	revalidateForKey(key);
	return at;
}

export async function publishPage(key: SnapshotKey): Promise<PublishState> {
	await requirePermission("publish");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (!SNAPSHOT_KEYS.includes(key)) return { error: "Unknown section." };
	const at = await snapshot(key);
	if (!at) return { error: "Publish failed." };
	await logActivity("publish", SNAPSHOT_LABELS[key], "Published section");
	revalidatePath("/admin/publish");
	revalidatePath("/admin", "layout");
	return { ok: true, at };
}

export async function publishAll(): Promise<PublishState> {
	await requirePermission("publish");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	for (const key of SNAPSHOT_KEYS) {
		const at = await snapshot(key);
		if (!at) return { error: `Failed publishing ${SNAPSHOT_LABELS[key]}.` };
	}
	await logActivity("publish", "All sections", "Published everything");
	revalidatePath("/admin/publish");
	revalidatePath("/admin", "layout");
	return { ok: true, at: new Date().toISOString() };
}

export async function discardPage(key: SnapshotKey): Promise<PublishState> {
	await requirePermission("publish");
	if (DEV_BYPASS && !supabaseConfigured()) return { error: DEV_NOTICE };
	if (!SNAPSHOT_KEYS.includes(key)) return { error: "Unknown section." };

	const admin = createAdminClient();
	const { data: snap } = await admin
		.from("page_snapshots")
		.select("raw")
		.eq("page", key)
		.maybeSingle();
	const raw = snap?.raw;
	if (raw === null || raw === undefined)
		return { error: "No restore point yet — publish this section once first." };

	if (key === "products") {
		const { product_categories = [], products = [] } = raw as {
			product_categories: unknown[];
			products: unknown[];
		};
		const delProducts = await admin
			.from("products")
			.delete()
			.not("id", "is", null);
		if (delProducts.error)
			return { error: `Revert failed (products): ${delProducts.error.message}` };
		const delCats = await admin
			.from("product_categories")
			.delete()
			.not("id", "is", null);
		if (delCats.error)
			return { error: `Revert failed (categories): ${delCats.error.message}` };
		if (product_categories.length) {
			const insCats = await admin
				.from("product_categories")
				.insert(product_categories);
			if (insCats.error)
				return { error: `Revert failed (categories): ${insCats.error.message}` };
		}
		if (products.length) {
			const insProducts = await admin.from("products").insert(products);
			if (insProducts.error)
				return { error: `Revert failed (products): ${insProducts.error.message}` };
		}
	} else {
		const { error } = await admin
			.from("site_settings")
			.upsert({ key, value: raw }, { onConflict: "key" });
		if (error) return { error: `Revert failed: ${error.message}` };
	}

	await logActivity("discard", SNAPSHOT_LABELS[key], "Reverted draft to published");
	revalidatePath("/admin/publish");
	revalidatePath("/admin", "layout");
	return { ok: true };
}
