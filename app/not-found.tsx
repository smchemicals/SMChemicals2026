import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CtaButton } from "@/components/ui/cta-button";
import { BrandGlow, Eyebrow } from "@/components/ui/page-hero";
import { getPublishedContact } from "@/lib/cms/snapshots";

export const metadata: Metadata = {
	title: "Page not found",
	robots: { index: false, follow: true },
};

export default async function NotFound() {
	const contact = await getPublishedContact();

	return (
		<div className="flex min-h-dvh flex-col">
			<Header />
			<main className="relative flex flex-1 items-center overflow-hidden bg-background pt-32 pb-24">
				<BrandGlow />
				<div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10">
					<Eyebrow className="mb-6">Error 404</Eyebrow>
					<h1 className="text-5xl font-semibold leading-none tracking-tight text-foreground md:text-7xl">
						Page <span className="font-light text-muted">not found.</span>
					</h1>
					<p className="mt-6 max-w-xl text-base font-light leading-relaxed text-foreground/75 md:text-lg">
						The page you&apos;re looking for doesn&apos;t exist or has moved.
						Head back home, or browse our product catalogue.
					</p>
					<div className="mt-10 flex flex-col gap-4 sm:flex-row">
						<CtaButton href="/">Back to Home</CtaButton>
						<CtaButton href="/products" variant="outline">
							View Products
							<ArrowUpRight className="h-4 w-4" />
						</CtaButton>
					</div>
				</div>
			</main>
			<Footer phone={contact.phone} email={contact.email} />
		</div>
	);
}
