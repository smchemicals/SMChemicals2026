import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { StorageControls } from "@/components/storage-controls";
import { SITE } from "@/lib/site";
import { getPublishedContact } from "@/lib/cms/snapshots";

export const metadata: Metadata = {
	title: "Privacy",
	description: "What SM Chemicals keeps when you visit the site or send us a message, and what it is used for.",
	alternates: { canonical: "/privacy" },
};

const sections = (email: string) => [
	{
		title: "When you write to us",
		body: [
			"The name, company, email, phone number, chemicals, quantities and notes you give in our forms are sent by email to our team. We use them to reply to you and for nothing else: they are not used for marketing, and they are not sold or shared with anyone outside the company that helps us send and receive email.",
			`If you would like your details removed from our mailbox, write to ${email} and we will delete them.`,
		],
	},
	{
		title: "What this site keeps on your device",
		body: [
			"Only if you allow it: your light or dark choice, so the site opens the way you left it, and a note that you have seen the opening animation this visit. Both stay in your browser and are never sent to us. If you choose \u201CStore nothing\u201D, nothing is stored at all, and the site works the same way; it just doesn't remember. Because remembering a \u201Cno\u201D would itself be storing something, we ask again on your next visit.",
			"The site sets no tracking or advertising cookies.",
		],
		controls: true,
	},
	{
		title: "Counting visits",
		body: [
			"We count page views in two ways, neither of which uses cookies or follows you from site to site. A privacy-friendly analytics service counts visits to the site, and our own database keeps one number per page per day, how many times it was opened. Neither records who you are, and neither builds a profile of you. If your browser asks not to be tracked, we don\u2019t count your visit.",
		],
	},
	{
		title: "Questions",
		body: [`Ask us anything about this at ${email}.`],
	},
];

export default async function PrivacyPage() {
	const contact = await getPublishedContact();
	return (
		<>
			<PageHero lines={["Your", "privacy."]} lede={`How ${SITE.name} treats what you send and what the site keeps, in plain words.`} />
			<section className="bg-background py-24 text-foreground lg:py-36">
				<div className="mx-auto max-w-7xl px-6 sm:px-10">
					<div className="grid gap-16 lg:gap-24">
						{sections(contact.email).map((s) => (
							<div key={s.title} className="grid gap-5 lg:grid-cols-12 lg:gap-x-10">
								<h2 className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] lg:col-span-5">{s.title}</h2>
								<div className="grid gap-5 lg:col-span-6 lg:col-start-7">
									{s.body.map((p, n) => (
										<p key={n} className="text-lg leading-[1.65] text-foreground/80">
											{p}
										</p>
									))}
									{"controls" in s && s.controls && <StorageControls />}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</>
	);
}
