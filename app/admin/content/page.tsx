import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getSetting } from "@/lib/cms/settings";
import {
	defaultHome,
	defaultContact,
	type HomeContent,
	type ContactContent,
} from "@/data/content";
import { HomeForm, ContactForm } from "./ContentForms";
import { cleanContact, cleanHome } from "@/lib/cms/clean";
import { Notice, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Home and contact" };

export default async function ContentAdmin() {
	await requirePermission("content");
	const [home, contact] = await Promise.all([
		getSetting<HomeContent>("home", defaultHome),
		getSetting<ContactContent>("contact", defaultContact),
	]);

	return (
		<div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Home and contact">
				What the home page says (the sectors, the hero paragraph, the figures) and the contact details used across the site. About and careers have their own pages.
			</PageHeader>
			{DEV_BYPASS && <Notice tone="warn" className="mb-8">Dev mode: showing the built-in content. Connect Supabase to save edits.</Notice>}
			<div className="space-y-8">
				<HomeForm home={cleanHome(home)} />
				<ContactForm contact={cleanContact(contact)} />
			</div>
		</div>
	);
}
