import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getSetting } from "@/lib/cms/settings";
import {
	defaultHome,
	defaultContact,
	type HomeContent,
	type ContactContent,
} from "@/data/content";
import { HomeForm, ContactForm } from "./ContentForms";

export const metadata = { title: "Content" };

export default async function ContentAdmin() {
	await requirePermission("content");
	const [home, contact] = await Promise.all([
		getSetting<HomeContent>("home", defaultHome),
		getSetting<ContactContent>("contact", defaultContact),
	]);

	return (
		<div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
			<div className="mb-12">
				<div className="mb-5 flex items-center gap-3">
					<span className="h-px w-7 bg-accent-500" />
					<span className="type-label text-accent-500">
						Content
					</span>
				</div>
				<h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight leading-none">
					Site content<span className="text-white/50 font-light">.</span>
				</h1>
				<p className="mt-6 text-white/65 text-sm font-light tracking-wide">
					Edit the homepage figures and contact details. About and careers
					content live in their own sections.
				</p>
				{DEV_BYPASS && (
					<p className="mt-4 inline-block border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-amber-300 text-xs font-medium tracking-wide">
						Dev mode — showing defaults. Connect Supabase to save edits.
					</p>
				)}
			</div>

			<div className="space-y-10">
				<HomeForm home={home} />
				<ContactForm contact={contact} />
			</div>
		</div>
	);
}
