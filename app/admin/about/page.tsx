import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getSetting } from "@/lib/cms/settings";
import { defaultAbout, type AboutContent } from "@/data/about";
import {
	AboutValuesForm,
	AboutTimelineForm,
	AboutCertsForm,
} from "./AboutForms";
import { PageHeader, Notice } from "@/components/admin/ui";

export const metadata = { title: "About" };

export default async function AboutAdmin() {
	await requirePermission("about");
	const about = await getSetting<AboutContent>("about", defaultAbout);

	return (
		<div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="About">
				The purpose cards, milestones and certifications on the About page. Each section saves on its own, and icons stay fixed by position.
			</PageHeader>
			{DEV_BYPASS && <Notice tone="warn" className="mb-8">Dev mode: showing the built-in content. Connect Supabase to save edits.</Notice>}

			<div className="space-y-16">
				<AboutValuesForm section={about.values} />
				<AboutTimelineForm section={about.timeline} />
				<AboutCertsForm section={about.certifications} />
			</div>
		</div>
	);
}
