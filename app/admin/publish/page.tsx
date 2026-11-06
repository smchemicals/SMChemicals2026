import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getDrafts } from "@/lib/cms/snapshots";
import { supabaseConfigured } from "@/lib/cms/products";
import { PublishPanel } from "./PublishPanel";
import { PageHeader, Notice } from "@/components/admin/ui";

export const metadata = { title: "Publish" };

export default async function PublishAdmin() {
	await requirePermission("publish");
	const pages = await getDrafts();
	const dirty = pages.filter((p) => p.status !== "clean").length;

	return (
		<div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Publish">
				Your edits stay as drafts until you publish. Review what changed, then push each section, or everything, live.{" "}
				{dirty > 0 ? `${dirty} section${dirty === 1 ? "" : "s"} with unpublished changes.` : "Everything is up to date."}
			</PageHeader>
			{DEV_BYPASS && <Notice tone="warn" className="mb-8">Dev mode: publishing is disabled. Connect Supabase to go live.</Notice>}
			{!DEV_BYPASS && !supabaseConfigured() && <Notice tone="warn" className="mb-8">Supabase is not configured. Set its environment variables to enable publishing.</Notice>}

			<PublishPanel pages={pages} />
		</div>
	);
}
