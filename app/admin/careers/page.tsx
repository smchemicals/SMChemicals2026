import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getSetting } from "@/lib/cms/settings";
import { defaultCareers, type CareersContent } from "@/data/careers";
import { CareersForm } from "./CareersForms";
import { PageHeader, Notice } from "@/components/admin/ui";

export const metadata = { title: "Careers" };

export default async function CareersAdmin() {
	await requirePermission("careers");
	const careers = await getSetting<CareersContent>("careers", defaultCareers);

	return (
		<div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Careers">
				The careers intro, culture values and open positions. Roles you add appear on the careers page once published.
			</PageHeader>
			{DEV_BYPASS && <Notice tone="warn" className="mb-8">Dev mode: showing the built-in content. Connect Supabase to save edits.</Notice>}

			<CareersForm careers={careers} />
		</div>
	);
}
