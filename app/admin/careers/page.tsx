import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getSetting } from "@/lib/cms/settings";
import { defaultCareers, type CareersContent } from "@/data/careers";
import { CareersForm } from "./CareersForms";

export const metadata = { title: "Careers" };

export default async function CareersAdmin() {
	await requirePermission("careers");
	const careers = await getSetting<CareersContent>("careers", defaultCareers);

	return (
		<div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
			<div className="mb-12">
				<div className="mb-5 flex items-center gap-3">
					<span className="h-px w-7 bg-accent-500" />
					<span className="type-label text-accent-500">
						Careers
					</span>
				</div>
				<h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight leading-none">
					Careers content<span className="text-white/50 font-light">.</span>
				</h1>
				<p className="mt-6 text-white/65 text-sm font-light tracking-wide">
					Edit the careers intro, culture values and open positions. Roles you
					add appear instantly on the public careers page.
				</p>
				{DEV_BYPASS && (
					<p className="mt-4 inline-block border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-amber-300 text-xs font-medium tracking-wide">
						Dev mode — showing defaults. Connect Supabase to save edits.
					</p>
				)}
			</div>

			<CareersForm careers={careers} />
		</div>
	);
}
