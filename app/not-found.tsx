import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { NotFoundHero } from "@/components/not-found-hero";
import { getPublishedContact } from "@/lib/cms/snapshots";

export const metadata: Metadata = {
	title: "404, page not found",
	robots: { index: false, follow: true },
};

export default async function NotFound() {
	const contact = await getPublishedContact();

	return (
		<div className="flex min-h-dvh flex-col">
			<Header phone={contact.phone} email={contact.email} />
			<main className="flex flex-1 flex-col">
				<NotFoundHero />
			</main>
			<Footer phone={contact.phone} email={contact.email} />
		</div>
	);
}
